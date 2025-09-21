import { computed, Injectable } from '@angular/core';
import { GameEditorTileDto } from '@app/api/model/gameEditorTileDto';
import { EditorProblem } from '@app/interfaces/game-editor.interface';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { TileKind } from '@common/enums/tile-kind.enum';

@Injectable({ providedIn: 'root' })
export class GameEditorCheckService {
    private static readonly minTerrainRatio = 0.5;
    private static readonly percentBase = 100;

    constructor(private readonly store: GameEditorStoreService) {}

    readonly editorProblems = computed<EditorProblem[]>(() => {
        const list: EditorProblem[] = [];
        const tiles = this.store.tiles();

        list.push(...this.checkDoors(tiles));
        list.push(...this.checkTerrainCoverage(tiles));
        list.push(...this.checkTerrainAccessibility(tiles));

        return list;
    });

    canSave(): boolean {
        return this.editorProblems().length === 0;
    }

    getNeighborKind(x: number, y: number): GameEditorTileDto.KindEnum | null {
        return this.store.getTileAt(x, y)?.kind ?? null;
    }

    isTerrain(kind: GameEditorTileDto.KindEnum): boolean {
        return kind === TileKind.BASE || kind === TileKind.WATER || kind === TileKind.ICE;
    }

    private isValidHorizontalDoor(
        left: GameEditorTileDto.KindEnum | null,
        right: GameEditorTileDto.KindEnum | null,
        top: GameEditorTileDto.KindEnum | null,
        bottom: GameEditorTileDto.KindEnum | null,
    ): boolean {
        return left === TileKind.WALL && right === TileKind.WALL && top !== null && this.isTerrain(top) && bottom !== null && this.isTerrain(bottom);
    }

    private isValidVerticalDoor(
        top: GameEditorTileDto.KindEnum | null,
        bottom: GameEditorTileDto.KindEnum | null,
        left: GameEditorTileDto.KindEnum | null,
        right: GameEditorTileDto.KindEnum | null,
    ): boolean {
        return top === TileKind.WALL && bottom === TileKind.WALL && left !== null && this.isTerrain(left) && right !== null && this.isTerrain(right);
    }

    private checkDoors(tiles: GameEditorTileDto[]): EditorProblem[] {
        const probs: EditorProblem[] = [];
        for (const t of tiles) {
            if (t.kind !== TileKind.DOOR) continue;
            const { x, y } = t;

            const leftKind = this.getNeighborKind(x - 1, y);
            const rightKind = this.getNeighborKind(x + 1, y);
            const topKind = this.getNeighborKind(x, y - 1);
            const bottomKind = this.getNeighborKind(x, y + 1);

            if (
                !this.isValidHorizontalDoor(leftKind, rightKind, topKind, bottomKind) &&
                !this.isValidVerticalDoor(topKind, bottomKind, leftKind, rightKind)
            ) {
                probs.push({
                    locationX: x,
                    locationY: y,
                    message: 'Porte mal placée : doit être encadrée de murs et ouverte sur terrain.',
                });
            }
        }
        return probs;
    }

    private checkTerrainCoverage(tiles: GameEditorTileDto[]): EditorProblem[] {
        const size = this.store.size();
        const total = size * size;
        const terrainCount = tiles.filter((t) => this.isTerrain(t.kind)).length;
        const ratio = terrainCount / total;
        if (ratio <= GameEditorCheckService.minTerrainRatio) {
            return [
                {
                    locationX: -1,
                    locationY: -1,
                    message: `Moins de 50% du terrain est du terrain jouable (${(ratio * GameEditorCheckService.percentBase).toFixed(1)}%).`,
                },
            ];
        }
        return [];
    }

    /** Below : use BFS algorithm to find all walkable tiles and accessible areas */

    private checkTerrainAccessibility(tiles: GameEditorTileDto[]): EditorProblem[] {
        const size = this.store.size();
        const grid = this.buildTileKindGrid(tiles, size);
        const components = this.connectedWalkableComponents(grid, size);
        if (components.length === 0) return [];

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
                    if (!item) continue;
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
                comps.push({ set: comp, size: comp.size });
            }
        }
        return comps;
    }

    private findInaccessibleTiles(tiles: GameEditorTileDto[], visited: Set<string>): EditorProblem[] {
        const probs: EditorProblem[] = [];
        for (const t of tiles) {
            if (this.isWalkableTile(t.kind) && !visited.has(`${t.x}:${t.y}`)) {
                probs.push({
                    locationX: t.x,
                    locationY: t.y,
                    message: 'Tuile inaccessible à cause des murs.',
                });
            }
        }
        return probs;
    }
}
