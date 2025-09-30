import { computed, Injectable } from '@angular/core';
import { GameEditorTileDto } from '@app/dto/gameEditorTileDto';
import { AccesibilityIssue, GameEditorIssue, GameEditorIssues } from '@app/interfaces/game-editor.interface';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import {
    NAME_MIN_LENGTH,
    GAME_NAME_MAX_LENGTH,
    DESCRIPTION_MIN_LENGTH,
    DESCRIPTION_MAX_LENGTH,
    WHITESPACE_PATTERN,
} from '@app/constants/validation.constants';
import { GameMode } from '@common/enums/game-mode.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

@Injectable()
export class GameEditorCheckService {
    private static readonly minTerrainRatio = 0.5;
    private static readonly percentBase = 100;

    constructor(private readonly gameEditorStoreService: GameEditorStoreService) {}

    readonly editorProblems = computed<GameEditorIssues>(() => {
        const issues: GameEditorIssues = {
            terrainCoverage: { hasIssue: false },
            doors: { hasIssue: false, tiles: [] },
            terrainAccessibility: { hasIssue: false, tiles: [] },
            startPlacement: { hasIssue: false },
            flagPlacement: { hasIssue: false },
            nameValidation: { hasIssue: false },
            descriptionValidation: { hasIssue: false },
        };
        const tiles = this.gameEditorStoreService.tiles();

        issues.doors = this.checkDoors(tiles);
        issues.terrainCoverage = this.checkTerrainCoverage(tiles);
        issues.terrainAccessibility = this.checkTerrainAccessibility(tiles);
        issues.startPlacement = this.checkAllStartPlaced();
        issues.flagPlacement = this.checkAllFlagPlaced();
        issues.nameValidation = this.checkNameValidation();
        issues.descriptionValidation = this.checkDescriptionValidation();
        return issues;
    });

    canSave(): boolean {
        return !Object.values(this.editorProblems()).some((p) => p.hasIssue);
    }

    private isTerrainTile(kind: GameEditorTileDto.KindEnum): boolean {
        return kind === TileKind.BASE || kind === TileKind.WATER || kind === TileKind.ICE;
    }

    private isValidHorizontalDoor(
        left: GameEditorTileDto.KindEnum | undefined,
        right: GameEditorTileDto.KindEnum | undefined,
        top: GameEditorTileDto.KindEnum | undefined,
        bottom: GameEditorTileDto.KindEnum | undefined,
    ): boolean {
        return (
            left === TileKind.WALL &&
            right === TileKind.WALL &&
            top !== undefined &&
            this.isTerrainTile(top) &&
            bottom !== undefined &&
            this.isTerrainTile(bottom)
        );
    }

    private isValidVerticalDoor(
        top: GameEditorTileDto.KindEnum | undefined,
        bottom: GameEditorTileDto.KindEnum | undefined,
        left: GameEditorTileDto.KindEnum | undefined,
        right: GameEditorTileDto.KindEnum | undefined,
    ): boolean {
        return (
            top === TileKind.WALL &&
            bottom === TileKind.WALL &&
            left !== undefined &&
            this.isTerrainTile(left) &&
            right !== undefined &&
            this.isTerrainTile(right)
        );
    }

    private checkAllStartPlaced(): GameEditorIssue {
        const problem: GameEditorIssue = { hasIssue: false };
        const inventory = this.gameEditorStoreService.inventory();
        const startItem = inventory.START;
        if (startItem && startItem.remaining > 0) {
            problem.message = 'Tous les points de départ doivent être placés sur la carte.';
            problem.hasIssue = true;
        }
        return problem;
    }

    private checkAllFlagPlaced(): GameEditorIssue {
        const problem: GameEditorIssue = { hasIssue: false };
        if (this.gameEditorStoreService.mode() === GameMode.CTF) {
            const inventory = this.gameEditorStoreService.inventory();
            const flagItem = inventory.FLAG;
            if (flagItem && flagItem.remaining > 0) {
                problem.message = 'Tous les drapeaux doivent être placés sur la carte.';
                problem.hasIssue = true;
            }
        }
        return problem;
    }

    private checkDoors(tiles: GameEditorTileDto[]): AccesibilityIssue {
        const probs: AccesibilityIssue = {
            tiles: [],
            hasIssue: false,
        };
        for (const t of tiles) {
            if (t.kind !== TileKind.DOOR) continue;
            const { x, y } = t;

            const leftKind = this.gameEditorStoreService.getTileAt(x - 1, y)?.kind;
            const rightKind = this.gameEditorStoreService.getTileAt(x + 1, y)?.kind;
            const topKind = this.gameEditorStoreService.getTileAt(x, y - 1)?.kind;
            const bottomKind = this.gameEditorStoreService.getTileAt(x, y + 1)?.kind;

            if (
                !this.isValidHorizontalDoor(leftKind, rightKind, topKind, bottomKind) &&
                !this.isValidVerticalDoor(topKind, bottomKind, leftKind, rightKind)
            ) {
                probs.tiles.push({
                    x,
                    y,
                });
                probs.hasIssue = true;
                probs.message = 'Une porte doit être placée entre deux murs et adossée à des tuiles de terrain.';
            }
        }
        return probs;
    }

    private checkTerrainCoverage(tiles: GameEditorTileDto[]): GameEditorIssue {
        const size = this.gameEditorStoreService.size();
        const total = size * size;
        const terrainCount = tiles.filter((t) => this.isTerrainTile(t.kind)).length;
        const ratio = terrainCount / total;
        const probs: GameEditorIssue = { hasIssue: false };
        if (ratio <= GameEditorCheckService.minTerrainRatio) {
            probs.hasIssue = true;
            probs.message = `Le ratio de tuiles de terrain est trop bas (${(ratio * GameEditorCheckService.percentBase).toFixed(
                2,
            )} %). Il doit être supérieur à ${GameEditorCheckService.minTerrainRatio * GameEditorCheckService.percentBase} %.`;
        }
        return probs;
    }

    private checkTerrainAccessibility(tiles: GameEditorTileDto[]): AccesibilityIssue {
        const size = this.gameEditorStoreService.size();
        const grid = this.buildTileKindGrid(tiles, size);
        const components = this.connectedWalkableComponents(grid, size);
        if (components.length === 0) return { hasIssue: true, tiles: [] };

        let largest = components[0];
        for (const comp of components) if (comp.size > largest.size) largest = comp;

        const visited = largest;
        return this.findInaccessibleTiles(tiles, visited.set);
    }

    private buildTileKindGrid(tiles: GameEditorTileDto[], size: number): TileKind[][] {
        const grid: TileKind[][] = Array.from({ length: size }, () => Array<TileKind>(size).fill(TileKind.WALL));
        for (const t of tiles) {
            grid[t.y][t.x] = t.kind as TileKind;
        }
        return grid;
    }

    private isWalkableTile(kind: GameEditorTileDto.KindEnum | TileKind | undefined): boolean {
        return kind === TileKind.BASE || kind === TileKind.ICE || kind === TileKind.WATER || kind === TileKind.DOOR || kind === TileKind.TELEPORT;
    }

    private connectedWalkableComponents(grid: TileKind[][], size: number): { set: Set<string>; size: number }[] {
        const seen = new Set<string>();
        const comps: { set: Set<string>; size: number }[] = [];
        const dirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ] as const;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (!this.isWalkableTile(grid[y][x])) continue;
                const key0 = `${x}:${y}`;
                if (seen.has(key0)) continue;

                const q: [number, number][] = [[x, y]];
                const comp = new Set<string>();
                while (q.length) {
                    const item = q.shift();
                    if (item) {
                        const [cx, cy] = item;
                        const k = `${cx}:${cy}`;
                        if (seen.has(k)) continue;
                        seen.add(k);
                        comp.add(k);

                        for (const [dx, dy] of dirs) {
                            const nx = cx + dx;
                            const ny = cy + dy;
                            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                            if (!this.isWalkableTile(grid[ny][nx])) continue;
                            const nk = `${nx}:${ny}`;
                            if (!seen.has(nk)) q.push([nx, ny]);
                        }
                    }
                }
                comps.push({ set: comp, size: comp.size });
            }
        }
        return comps;
    }

    private findInaccessibleTiles(tiles: GameEditorTileDto[], visited: Set<string>): AccesibilityIssue {
        const probs: AccesibilityIssue = { hasIssue: false, tiles: [] };
        for (const t of tiles) {
            if (this.isWalkableTile(t.kind) && !visited.has(`${t.x}:${t.y}`)) {
                probs.hasIssue = true;
                probs.tiles.push({
                    x: t.x,
                    y: t.y,
                });
                probs.message = 'Certaines tuiles de terrain ne sont pas accessibles.';
            }
        }
        return probs;
    }

    private checkNameValidation(): GameEditorIssue {
        const name = this.gameEditorStoreService.name.trim();
        return name.length < NAME_MIN_LENGTH || name.length > GAME_NAME_MAX_LENGTH || name.replace(WHITESPACE_PATTERN, '').length === 0
            ? {
                  hasIssue: true,
                  message:
                      `Le nom doit contenir entre ${NAME_MIN_LENGTH} et ${GAME_NAME_MAX_LENGTH} caractères ` +
                      `et ne pas être composé uniquement d'espaces.`,
              }
            : { hasIssue: false };
    }

    private checkDescriptionValidation(): GameEditorIssue {
        const description = this.gameEditorStoreService.description.trim();
        return description.length < DESCRIPTION_MIN_LENGTH ||
            description.length > DESCRIPTION_MAX_LENGTH ||
            description.replace(WHITESPACE_PATTERN, '').length === 0
            ? {
                  hasIssue: true,
                  message:
                      `La description doit contenir entre ${DESCRIPTION_MIN_LENGTH} et ${DESCRIPTION_MAX_LENGTH} caractères ` +
                      `et ne pas être composée uniquement d'espaces.`,
              }
            : { hasIssue: false };
    }
}
