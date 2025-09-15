import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';
import {
    GameDraft,
    Grid,
    Objects,
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

    readonly draft$: Observable<GameDraft> = this._draft$.pipe(filter((d): d is GameDraft => d !== null));

    /** Selectors */
    readonly grid$ = this.draft$.pipe(map((d) => d.grid));
    readonly objects$ = this.draft$.pipe(map((d) => d.objects));
    readonly inventory$ = this.draft$.pipe(map((d) => d.inventory));
    readonly teleports$ = this.draft$.pipe(map((d) => d.teleports));
    readonly meta$ = this.draft$.pipe(map((d) => d.meta));
    readonly activeTool$ = this.draft$.pipe(map((d) => d.editor?.activeTool || { type: 'TILE_BRUSH', tile: { kind: TileKind.BASE } }));

    /** Specific selectors */
    readonly editorTileSize$ = this.draft$.pipe(map((d) => d.editor.tileSize || 0));
    readonly inventoryCounts$ = this.draft$.pipe(map((d) => d.inventory.available || ({} as Record<PlaceableKind, number>)));
    readonly objectsArray$ = this.draft$.pipe(map((d) => Object.values(d.objects.byId || {})));

    /** Exposed Methods and Core API */
    initDraft(name: string = '', description: string = '', size: SizePreset = 's', mode: GameMode = 'classic'): void {
        const preset = sizePresets[size];
        const baseGrid = this.createGrid(preset.dimensions);
        const entities: Objects = { byId: {} };

        const editor: EditorState = {
            activeTool: { type: 'TILE_BRUSH', tile: { kind: TileKind.BASE } },
            tileSize: 0,
        };

        const inventorySpec = this.createInventorySpec(size, mode);
        const inventory = this.getInventoryState(baseGrid, entities, inventorySpec);

        const draft: GameDraft = {
            meta: { name, description, sizePreset: size, mode },
            grid: baseGrid,
            objects: entities,
            editor,
            inventory,
        };

        this._draft$.next(draft);
    }

    loadDraft(draft: GameDraft): void {
        const inventorySpec = this.createInventorySpec(draft.meta.sizePreset, draft.meta.mode);
        const inventory = this.getInventoryState(draft.grid, draft.objects, inventorySpec);
        const updatedDraft = { ...draft, inventory };

        this._draft$.next(updatedDraft);
    }

    update(mutator: (draft: GameDraft) => GameDraft): void {
        const current = this._draft$.getValue();
        if (!current) throw new Error('No game draft available');
        const updated = mutator(current);
        this._draft$.next(updated);
    }

    setEditorTileSize(px: number): void {
        this.update((draft) => {
            return {
                ...draft,
                editor: {
                    ...draft.editor,
                    tileSize: px,
                },
            };
        });
    }

    copyDraftToClipboard(): void {
        const draft = this._draft$.getValue();
        if (!draft) throw new Error('No game draft available');
        const draftString = JSON.stringify(draft, null, 2);
        navigator.clipboard.writeText(draftString);
    }

    getDraftSnapshot(): GameDraft {
        const draft = this._draft$.getValue();
        if (!draft) throw new Error('No game draft available');
        return draft;
    }

    /** Private Helpers */
    private createGrid(dimensions: MapDimensions, defaultTile: TileSpec = { kind: TileKind.BASE }): Grid {
        const gridSize = dimensions.width * dimensions.height;
        return {
            width: dimensions.width,
            height: dimensions.height,
            tiles: Array.from({ length: gridSize }, () => ({ ...defaultTile })),
            objectIds: Array.from({ length: gridSize }, () => null),
        };
    }

    private createInventorySpec(size: SizePreset, gameMode: GameMode): InventorySpec {
        const objects = sizePresets[size].objects;
        return {
            allowance: {
                [PlaceableKind.START]: objects.startPoints,
                [PlaceableKind.FLAG]: gameMode === 'capture-the-flag' ? objects.flags : 0,
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

    private getInventoryState(grid: Grid, entities: Objects, spec: InventorySpec): InventoryState {
        const placed = this.emptyInventoryCounts();
        grid.objectIds.forEach((objId) => {
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
