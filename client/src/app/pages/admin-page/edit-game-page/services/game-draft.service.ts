import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import {
    GameDraft,
    Grid,
    Entities,
    InventoryState,
    EditorState,
    TileKind,
    GameMode,
    SizePreset,
    sizePresets,
    InventorySpec,
    MapDimensions,
    PlaceableKind,
    TileSpec,
} from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

@Injectable({
    providedIn: 'root',
})
export class GameDraftService {
    private readonly _draft$ = new BehaviorSubject<GameDraft | null>(null);

    readonly draft$: Observable<GameDraft> = this._draft$.asObservable().pipe(
        map((draft) => {
            if (!draft) throw new Error('No game draft available');
            return draft;
        }),
    );

    /** Selectors */
    readonly grid$ = this.draft$.pipe(map((d) => d.grid));
    readonly entities$ = this.draft$.pipe(map((d) => d.entities));
    readonly inventory$ = this.draft$.pipe(map((d) => d.inventory));
    readonly teleports$ = this.draft$.pipe(map((d) => d.teleports));
    readonly meta$ = this.draft$.pipe(map((d) => d.meta));
    readonly activeTool$ = this.draft$.pipe(map((d) => d.editor?.activeTool || { type: 'TILE_BRUSH', tile: { kind: TileKind.BASE } }));

    /** Exposed Methods and Core API */
    initDraft(
        name: string = '',
        description: string = '',
        size: SizePreset = 's',
        mode: GameMode = 'CLASSIC',
        viewPort: { x: number; y: number } = { x: 800, y: 800 },
    ): void {
        const preset = sizePresets[size];
        const baseGrid = this.createGrid(preset.dimensions);
        const entities: Entities = { byId: {} };

        const editor: EditorState = {
            activeTool: { type: 'TILE_BRUSH', tile: { kind: TileKind.BASE } },
            viewPort,
        };

        const inventorySpec = this.createInventorySpec(size, mode);
        const inventory = this.getInventoryState(baseGrid, entities, inventorySpec);

        const draft: GameDraft = {
            meta: { name, description, sizePreset: size, mode },
            grid: baseGrid,
            entities,
            editor,
            inventory,
        };

        this._draft$.next(draft);
    }

    loadDraft(draft: GameDraft): void {
        const inventorySpec = this.createInventorySpec(draft.meta.sizePreset, draft.meta.mode);
        const inventory = this.getInventoryState(draft.grid, draft.entities, inventorySpec);
        const updatedDraft = { ...draft, inventory };
        this._draft$.next(updatedDraft);
    }

    update(mutator: (draft: GameDraft) => GameDraft): void {
        const current = this._draft$.getValue();
        if (!current) throw new Error('No game draft available');
        const updated = mutator(current);
        this._draft$.next(updated);
    }

    /** Private Helpers */
    private createGrid(dimensions: MapDimensions, defaultTile: TileSpec = { kind: TileKind.BASE }): Grid {
        const gridSize = dimensions.width * dimensions.height;
        return {
            width: dimensions.width,
            height: dimensions.height,
            tiles: Array(gridSize).fill(defaultTile),
            objectIdByIndex: Array(gridSize).fill(null),
        };
    }

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

    private emptyInventoryCounts(): InventoryState {
        return {
            available: {
                [PlaceableKind.START]: 0,
                [PlaceableKind.FLAG]: 0,
                [PlaceableKind.HEAL]: 0,
                [PlaceableKind.FIGHT]: 0,
                [PlaceableKind.BOAT]: 0,
            },
        };
    }

    private getInventoryState(grid: Grid, entities: Entities, spec: InventorySpec): InventoryState {
        const placed = this.emptyInventoryCounts();
        grid.objectIdByIndex.forEach((objId) => {
            if (objId) {
                const entity = entities.byId[objId];
                if (entity) placed.available[entity.kind] = (placed.available[entity.kind] || 0) + 1;
            }
        });

        const available = this.emptyInventoryCounts();
        (Object.keys(available.available) as PlaceableKind[]).forEach((kind) => {
            const allowed = spec.allowance[kind] || 0;
            const used = placed.available[kind] || 0;
            available.available[kind] = Math.max(allowed - used, 0);
        });

        return available;
    }
}
