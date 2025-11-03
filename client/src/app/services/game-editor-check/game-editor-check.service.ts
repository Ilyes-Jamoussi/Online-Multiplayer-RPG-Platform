import { computed, Injectable } from '@angular/core';
import {
    DESCRIPTION_MAX_LENGTH,
    DESCRIPTION_MIN_LENGTH,
    GAME_NAME_MAX_LENGTH,
    NAME_MIN_LENGTH,
    WHITESPACE_PATTERN,
} from '@app/constants/validation.constants';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { AccesibilityIssue, GameEditorIssue, GameEditorIssues } from '@app/interfaces/game-editor.interface';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { ConnectedComponent } from '@common/interfaces/connected-component.interface';


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
        return !Object.values(this.editorProblems()).some((issue) => issue.hasIssue);
    }

    private isTerrainTile(kind: TileKind | undefined): boolean {
        return kind === TileKind.BASE || kind === TileKind.WATER || kind === TileKind.ICE;
    }

    private isValidHorizontalDoor(
        left: TileKind | undefined,
        right: TileKind | undefined,
        top: TileKind | undefined,
        bottom: TileKind | undefined,
    ): boolean {
        return (
            left === TileKind.WALL &&
            right === TileKind.WALL &&
            this.isTerrainTile(top) &&
            this.isTerrainTile(bottom)
        );
    }

    private isValidVerticalDoor(
        top: TileKind | undefined,
        bottom: TileKind | undefined,
        left: TileKind | undefined,
        right: TileKind | undefined,
    ): boolean {
        return (
            top === TileKind.WALL &&
            bottom === TileKind.WALL &&
            this.isTerrainTile(left) &&
            this.isTerrainTile(right)
        );
    }

    private checkAllStartPlaced(): GameEditorIssue {
        const problem: GameEditorIssue = { hasIssue: false };
        const inventory = this.gameEditorStoreService.inventory();
        const startItem = inventory.START;
        if (startItem.remaining > 0) {
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
            if (flagItem.remaining > 0) {
                problem.message = 'Tous les drapeaux doivent être placés sur la carte.';
                problem.hasIssue = true;
            }
        }
        return problem;
    }

    private checkDoors(tiles: GameEditorTileDto[]): AccesibilityIssue {
        const doorIssue: AccesibilityIssue = {
            tiles: [],
            hasIssue: false,
        };
        for (const tile of tiles) {
            if (tile.kind !== TileKind.DOOR) continue;
            const { x, y } = tile;

            const leftKind = this.gameEditorStoreService.getTileAt(x - 1, y)?.kind;
            const rightKind = this.gameEditorStoreService.getTileAt(x + 1, y)?.kind;
            const topKind = this.gameEditorStoreService.getTileAt(x, y - 1)?.kind;
            const bottomKind = this.gameEditorStoreService.getTileAt(x, y + 1)?.kind;

            if (
                !this.isValidHorizontalDoor(leftKind, rightKind, topKind, bottomKind) &&
                !this.isValidVerticalDoor(topKind, bottomKind, leftKind, rightKind)
            ) {
                doorIssue.tiles.push({
                    x,
                    y,
                });
                doorIssue.hasIssue = true;
                doorIssue.message = 'Une porte doit être placée entre deux murs et adossée à des tuiles de terrain.';
            }
        }
        return doorIssue;
    }

    private checkTerrainCoverage(tiles: GameEditorTileDto[]): GameEditorIssue {
        const size = this.gameEditorStoreService.size();
        const total = size * size;
        const terrainCount = tiles.filter((tile) => this.isTerrainTile(tile.kind)).length;
        const ratio = terrainCount / total;
        const coverageIssue: GameEditorIssue = { hasIssue: false };
        if (ratio <= GameEditorCheckService.minTerrainRatio) {
            coverageIssue.hasIssue = true;
            coverageIssue.message = `Le ratio de tuiles de terrain est trop bas (${(ratio * GameEditorCheckService.percentBase).toFixed(
                2,
            )} %). Il doit être supérieur à ${GameEditorCheckService.minTerrainRatio * GameEditorCheckService.percentBase} %.`;
        }
        return coverageIssue;
    }

    private checkTerrainAccessibility(tiles: GameEditorTileDto[]): AccesibilityIssue {
        const size = this.gameEditorStoreService.size();
        const grid = this.buildTileKindGrid(tiles, size);
        const components = this.connectedWalkableComponents(grid, size);
        if (components.length === 0) return { hasIssue: true, tiles: [] };

        let largest = components[0];
        for (const component of components) if (component.size > largest.size) largest = component;

        const visited = largest;
        return this.findInaccessibleTiles(tiles, visited.set);
    }

    private buildTileKindGrid(tiles: GameEditorTileDto[], size: number): TileKind[][] {
        const grid: TileKind[][] = Array.from({ length: size }, () => Array<TileKind>(size).fill(TileKind.WALL));
        for (const tile of tiles) {
            grid[tile.y][tile.x] = tile.kind;
        }
        return grid;
    }

    private isWalkableTile(kind: TileKind | TileKind | undefined): boolean {
        return kind === TileKind.BASE || kind === TileKind.ICE || kind === TileKind.WATER || kind === TileKind.DOOR || kind === TileKind.TELEPORT;
    }

    private connectedWalkableComponents(grid: TileKind[][], size: number): ConnectedComponent[] {
        const seen = new Set<string>();
        const components: ConnectedComponent[] = [];

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (!this.isWalkableTile(grid[y][x])) continue;
                const startKey = this.cellKey(x, y);
                if (seen.has(startKey)) continue;

                const component = this.bfsComponent(x, y, grid, size, seen);
                components.push({ set: component, size: component.size });
            }
        }

        return components;
    }

    private cellKey(x: number, y: number): string {
        return `${x}:${y}`;
    }

    private isInBounds(x: number, y: number, size: number): boolean {
        return x >= 0 && y >= 0 && x < size && y < size;
    }

    private bfsComponent(startX: number, startY: number, grid: TileKind[][], size: number, seen: Set<string>): Set<string> {
        const queue: [number, number][] = [[startX, startY]];
        const component = new Set<string>();
        const directions = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ] as const;

        while (queue.length) {
            const item = queue.shift();
            if (!item) continue;
            const [currentX, currentY] = item;
            const cellKey = this.cellKey(currentX, currentY);
            if (seen.has(cellKey)) continue;

            seen.add(cellKey);
            component.add(cellKey);

            for (const [dx, dy] of directions) {
                const neighborX = currentX + dx;
                const neighborY = currentY + dy;
                if (!this.isInBounds(neighborX, neighborY, size)) continue;
                if (!this.isWalkableTile(grid[neighborY][neighborX])) continue;
                const neighborKey = this.cellKey(neighborX, neighborY);
                if (!seen.has(neighborKey)) queue.push([neighborX, neighborY]);
            }
        }

        return component;
    }

    private findInaccessibleTiles(tiles: GameEditorTileDto[], visited: Set<string>): AccesibilityIssue {
        const inaccessibleTilesIssue: AccesibilityIssue = { hasIssue: false, tiles: [] };
        for (const tile of tiles) {
            if (this.isWalkableTile(tile.kind) && !visited.has(`${tile.x}:${tile.y}`)) {
                inaccessibleTilesIssue.hasIssue = true;
                inaccessibleTilesIssue.tiles.push({
                    x: tile.x,
                    y: tile.y,
                });
                inaccessibleTilesIssue.message = 'Certaines tuiles de terrain ne sont pas accessibles.';
            }
        }
        return inaccessibleTilesIssue;
    }

    private checkNameValidation(): GameEditorIssue {
        const name = this.gameEditorStoreService.name.trim();
        const invalid =
            name.length < NAME_MIN_LENGTH ||
            name.length > GAME_NAME_MAX_LENGTH ||
            name.replace(WHITESPACE_PATTERN, '').length === 0;

        const result: GameEditorIssue = invalid
            ? {
                hasIssue: true,
                message:
                    `Le nom doit contenir entre ${NAME_MIN_LENGTH} et ${GAME_NAME_MAX_LENGTH} caractères ` +
                    `et ne pas être composé uniquement d'espaces.`,
            }
            : { hasIssue: false };

        return result;
    }

    private checkDescriptionValidation(): GameEditorIssue {
        const description = this.gameEditorStoreService.description.trim();
        const invalid =
            description.length < DESCRIPTION_MIN_LENGTH ||
            description.length > DESCRIPTION_MAX_LENGTH ||
            description.replace(WHITESPACE_PATTERN, '').length === 0;

        const result: GameEditorIssue = invalid
            ? {
                hasIssue: true,
                message:
                    `La description doit contenir entre ${DESCRIPTION_MIN_LENGTH} et ${DESCRIPTION_MAX_LENGTH} caractères ` +
                    `et ne pas être composée uniquement d'espaces.`,
            }
            : { hasIssue: false };

        return result;
    }
}
