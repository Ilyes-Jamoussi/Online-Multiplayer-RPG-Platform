import { Injectable } from '@angular/core';
import { GameDraftService } from '@app/pages/admin-page/edit-game-page/services/game-draft.service';
import { PlaceableKind, Entities, InventoryState, Placeable, GameDraft } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';
import { indexOf } from '@app/pages/admin-page/edit-game-page/utils/grid-utils';

@Injectable({
    providedIn: 'root',
})
export class ObjectService {
    constructor(private readonly draftService: GameDraftService) {}

    /** Exposed Methods */
    tryPlaceObject(x: number, y: number, kind: PlaceableKind): void {
        this.draftService.update((draft) => {
            if (!this.canPlaceObject(draft, x, y, kind)) return draft;

            const placeable = this.createPlaceable(kind);
            const newEntities: Entities = {
                byId: {
                    ...draft.entities.byId,
                    [placeable.id]: placeable,
                },
            };
            const newObjIdByIndex = this.placeObjectOnGrid(draft, x, y, kind, placeable.id);
            const newInventory = this.updateInventoryAfterPlacement(draft, kind);

            return {
                ...draft,
                entities: newEntities,
                grid: { ...draft.grid, objectIdByIndex: newObjIdByIndex },
                inventory: newInventory,
            };
        });
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
            if (idxs.some((i) => draft.grid.objectIdByIndex[i])) return false;
        } else {
            const idx = indexOf(x, y, draft.grid.width);
            if (draft.grid.objectIdByIndex[idx]) return false;
        }
        return true;
    }

    private placeObjectOnGrid(draft: GameDraft, x: number, y: number, kind: PlaceableKind, id: string): string[] {
        const newObjIdByIndex = draft.grid.objectIdByIndex.slice();
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

    private createPlaceable(kind: PlaceableKind): Placeable {
        const id = Math.random().toString(ObjectService.randomIdRadix).substring(2, ObjectService.randomIdLength);
        return { id, kind } as Placeable;
    }
}
