import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

// 👉 Adapte le chemin suivant selon où tu as mis les types (ici on suppose `game-editor-model.ts` à côté)
import {
    ActiveTool,
    EditorState,
    Entities,
    // Footprint,
    GameDraft,
    // GameMeta,
    GameMode,
    Grid,
    InventorySpec,
    InventoryState,
    MapDimensions,
    // Placeable,
    PlaceableKind,
    SizePreset,
    // TeleportPairs,
    TileKind,
    TileSpec,
    sizePresets,
} from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

@Injectable({
    providedIn: 'root',
})
export class GameEditorService {
    private readonly _draft$ = new BehaviorSubject<GameDraft | null>(null);
    readonly draft$: Observable<GameDraft> = this._draft$.asObservable().pipe(
        map((draft) => {
            if (!draft) {
                throw new Error('No game draft available');
            }
            return draft;
        }),
    );

    // selectors
    readonly grid$ = this.draft$.pipe(map((draft) => draft.grid));
    readonly activeTool$ = this.draft$.pipe(map((draft) => draft.editor?.activeTool || { type: 'TILE_BRUSH', tile: { kind: TileKind.BASE } }));
    readonly inventory$ = this.draft$.pipe(map((draft) => draft.inventory));
    readonly entities$ = this.draft$.pipe(map((draft) => draft.entities));
    readonly teleports$ = this.draft$.pipe(map((draft) => draft.teleports));
    readonly meta$ = this.draft$.pipe(map((draft) => draft.meta));

    private static readonly placeableKinds: readonly PlaceableKind[] = [
        PlaceableKind.START,
        PlaceableKind.FLAG,
        PlaceableKind.HEAL,
        PlaceableKind.FIGHT,
        PlaceableKind.BOAT,
    ] as const;

    //  create a grid
    private createGrid(dimensions: MapDimensions, defaultTile: TileSpec = { kind: TileKind.BASE }): Grid {
        const gridSize = dimensions.width * dimensions.height;
        return {
            width: dimensions.width,
            height: dimensions.height,
            tiles: Array(gridSize).fill(defaultTile),
            objectIdByIndex: Array(gridSize).fill(null),
        };
    }

    // create entities (placeables )
    private createEntities(): Entities {
        return { byId: {} };
    }

    // create inventory specs
    private createInventorySpec(size: SizePreset, gameMode: GameMode): InventorySpec {
        const objects = sizePresets[size].objects;
        return {
            allowance: {
                [PlaceableKind.START]: objects.startPoints,
                [PlaceableKind.FLAG]: gameMode === 'CTF' ? objects.flags : 0,
                [PlaceableKind.HEAL]: objects.heal,
                [PlaceableKind.FIGHT]: objects.fight,
                [PlaceableKind.BOAT]: objects.boats,
            },
        };
    }

    private inventoryEmptyCounts = (): InventoryState => {
        return {
            available: {
                [PlaceableKind.START]: 0,
                [PlaceableKind.FLAG]: 0,
                [PlaceableKind.HEAL]: 0,
                [PlaceableKind.FIGHT]: 0,
                [PlaceableKind.BOAT]: 0,
            },
        };
    };

    private getInventoryState(grid: Grid, entities: Entities, inventorySpec: InventorySpec): InventoryState {
        const placed = this.inventoryEmptyCounts();
        grid.objectIdByIndex.forEach((objId) => {
            if (objId) {
                const entity = entities.byId[objId];
                if (entity) placed.available[entity.kind] = (placed.available[entity.kind] || 0) + 1;
            }
        });

        const available = this.inventoryEmptyCounts();
        GameEditorService.placeableKinds.forEach((kind) => {
            const allowed = inventorySpec.allowance[kind] || 0;
            const used = placed.available[kind] || 0;
            available.available[kind] = Math.max(allowed - used, 0);
        });

        return available;
    }

    private update(mutator: (draft: GameDraft) => GameDraft) {
        const current = this._draft$.getValue();
        if (!current) {
            throw new Error('No game draft available');
        }
        const updated = mutator(current);
        this._draft$.next(updated);
    }

    private getTile(grid: Grid, x: number, y: number): TileSpec {
        if (!grid) throw new Error('No grid available');
        if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) throw new Error('Coordinates out of bounds');
        const index = this.indexOf(x, y, grid.width);
        return grid.tiles[index];
    }

    private setTile(grid: Grid, x: number, y: number, tile: TileSpec): Grid {
        if (!this.inBounds(x, y, grid)) return grid;
        const idx = this.indexOf(x, y, grid.width);
        const tiles = grid.tiles.slice();
        tiles[idx] = tile;
        return {
            ...grid,
            tiles,
        };
    }

    private indexOf(x: number, y: number, width: number) {
        return y * width + x;
    }
    // private coordOf(index: number, width: number) {
    //     return { x: index % width, y: Math.floor(index / width) };
    // }
    private inBounds(x: number, y: number, g: Grid) {
        return x >= 0 && y >= 0 && x < g.width && y < g.height;
    }
    // private isTerrain(t: TileSpec) {
    //     return t.kind === TileKind.BASE || t.kind === TileKind.WATER || t.kind === TileKind.ICE;
    // }
    // private footprintOf(k: PlaceableKind): Footprint {
    //     return k === PlaceableKind.HEAL || k === PlaceableKind.FIGHT ? { w: 2, h: 2 } : { w: 1, h: 1 };
    // }
    // private uid(): string {
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     return Math.random().toString(36).substring(2, 9);
    // }

    // init a new draft
    initDraft(name: string = '', description: string = '', size: SizePreset = 's', mode: GameMode = 'CLASSIC', viewPort?: { x: number; y: number }) {
        const preset = sizePresets[size];
        const baseGrid = this.createGrid(preset.dimensions);
        const entities = this.createEntities();
        const editor: EditorState = {
            activeTool: { type: 'TILE_BRUSH', tile: { kind: TileKind.BASE } },
            viewPort: viewPort || { x: 800, y: 800 },
        };
        const inventorySpec = this.createInventorySpec(size, mode);
        const inventoryState = this.getInventoryState(baseGrid, entities, inventorySpec);

        const finalDraft: GameDraft = {
            meta: { name, description, sizePreset: size, mode },
            grid: baseGrid,
            entities,
            editor,
            inventory: inventoryState,
        };
        this._draft$.next(finalDraft);
    }

    loadDraft(draft: GameDraft) {
        const inventorySpec = this.createInventorySpec(draft.meta.sizePreset, draft.meta.mode);
        const inventoryState = this.getInventoryState(draft.grid, draft.entities, inventorySpec);
        const updatedDraft = { ...draft, inventorySpec, inventoryState };
        this._draft$.next(updatedDraft);
    }

    setViewPort(x: number, y: number) {
        this.update((draft) => ({
            ...draft,
            editor: {
                ...draft.editor,
                viewPort: { x, y },
            },
        }));
    }

    setActiveTool(tool: ActiveTool) {
        this.update((draft) => ({
            ...draft,
            editor: {
                ...draft.editor,
                activeTool: tool,
            },
        }));
    }

    computeCellPXSize(viewPortPx: { x: number; y: number }, grid: Grid): { cellWidthPx: number; cellHeightPx: number } {
        const cellWidthPx = viewPortPx.x / grid.width;
        const cellHeightPx = viewPortPx.y / grid.height;
        return { cellWidthPx, cellHeightPx };
    }

    applyLeftClickPaint(x: number, y: number) {
        this.update((draft) => {
            const tool = draft.editor?.activeTool;
            if (!tool || tool.type !== 'TILE_BRUSH') return draft;
            const tile = this.getTile(draft.grid, x, y);
            if (tile.kind === TileKind.DOOR && tool.tile.kind === TileKind.DOOR) {
                const idx = this.indexOf(x, y, draft.grid.width);
                const tiles = draft.grid.tiles.slice();
                tiles[idx] = { kind: TileKind.DOOR, open: !tile.open };
                return {
                    ...draft,
                    grid: {
                        ...draft.grid,
                        tiles,
                    },
                };
            }

            if (tile.kind === tool.tile.kind && tile.kind !== TileKind.DOOR) return draft; // no change if same tile (except door)

            return {
                ...draft,
                grid: this.setTile(draft.grid, x, y, tool.tile),
            };
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    applyRightClick(x: number, y: number) {
        // dont do anything for now
        // TODO !!!
        return this.update((draft) => draft);
    }
}
