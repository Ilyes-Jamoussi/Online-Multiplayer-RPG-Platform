import { Injectable } from '@angular/core';
import { GameDraftService } from './game-draft.service';
import {
    PlaceableKind,
    Objects,
    InventoryState,
    PlaceableObject,
    GameDraft,
} from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';
import { indexOf } from '@app/services/game/utils/grid-utils';

@Injectable({
    providedIn: 'root',
})
export class ObjectService {
    constructor(private readonly draftService: GameDraftService) {}

    /** Exposed Methods */
    tryPlaceObject(x: number, y: number, kind: PlaceableKind): void {
        this.draftService.update((draft) => {
            if (!this.canPlaceObject(draft, x, y, kind)) return draft;

            const placeable = this.createPlaceable(kind, x, y);
            const newEntities: Objects = {
                byId: {
                    ...draft.objects.byId,
                    [placeable.id]: placeable,
                },
            };
            const newObjIdByIndex = this.placeObjectOnGrid(draft, x, y, kind, placeable.id);
            const newInventory = this.updateInventoryAfterPlacement(draft, kind);

            // Ensure inventory is never undefined
            if (!newInventory) return draft;

            return {
                ...draft,
                objects: newEntities,
                grid: { ...draft.grid, objectIds: newObjIdByIndex },
                inventory: newInventory,
            };
        });
    }

    isObjectAvailable(kind: PlaceableKind): boolean {
        const inventory = this.draftService.inventory$;
        let available = false;
        inventory.subscribe((inv) => {
            available = (inv?.available?.[kind] ?? 0) > 0;
        });
        return available;
    }

    /** Private Helpers */
    private canPlaceObject(draft: GameDraft, x: number, y: number, kind: PlaceableKind): boolean {
        if ((draft.inventory?.available?.[kind] ?? 0) <= 0) return false;
        if (kind === PlaceableKind.HEAL || kind === PlaceableKind.FIGHT) {
            const idxs = [
                indexOf(x, y, draft.grid.width),
                indexOf(x + 1, y, draft.grid.width),
                indexOf(x, y + 1, draft.grid.width),
                indexOf(x + 1, y + 1, draft.grid.width),
            ];
            const unavailable = idxs.some((i) => {
                return draft.grid.tiles[i].kind !== 'BASE' || draft.grid.objectIds[i];
            });
            if (unavailable) return false;
        } else if (kind === PlaceableKind.BOAT) {
            const idx = indexOf(x, y, draft.grid.width);
            if (draft.grid.tiles[idx].kind !== 'WATER' || draft.grid.objectIds[idx]) return false;
        } else {
            const idx = indexOf(x, y, draft.grid.width);
            if (draft.grid.objectIds[idx] || draft.grid.tiles[idx].kind !== 'BASE') return false;
        }
        return true;
    }

    private placeObjectOnGrid(draft: GameDraft, x: number, y: number, kind: PlaceableKind, id: string): string[] {
        const newObjIdByIndex = draft.grid.objectIds.slice();
        if (kind === PlaceableKind.HEAL || kind === PlaceableKind.FIGHT) {
            const idxs = [
                indexOf(x, y, draft.grid.width),
                indexOf(x + 1, y, draft.grid.width),
                indexOf(x, y + 1, draft.grid.width),
                indexOf(x + 1, y + 1, draft.grid.width),
            ];
            idxs.forEach((i) => (newObjIdByIndex[i] = id));
        } else {
            const idx = indexOf(x, y, draft.grid.width);
            newObjIdByIndex[idx] = id;
        }
        return newObjIdByIndex.map((val) => val ?? '');
    }

    private updateInventoryAfterPlacement(draft: GameDraft, kind: PlaceableKind): InventoryState {
        return {
            ...draft.inventory,
            available: {
                ...draft.inventory.available,
                [kind]: (draft.inventory.available?.[kind] ?? 0) - 1,
            },
        };
    }

    private static readonly randomIdRadix = 36;
    private static readonly randomIdLength = 9;

    private createPlaceable(kind: PlaceableKind, x: number, y: number): PlaceableObject {
        const id = Math.random().toString(ObjectService.randomIdRadix).substring(2, ObjectService.randomIdLength);
        return { id, kind, position: { x, y } } as PlaceableObject;
    }
}
