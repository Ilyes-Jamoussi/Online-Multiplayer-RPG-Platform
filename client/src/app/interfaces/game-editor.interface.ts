import { PlaceableKind } from '@common/enums/placeable-kind.enum';
export interface EditorProblem {
    locationX: number;
    locationY: number;
    message: string;
}

export interface InventoryItem {
    kind: PlaceableKind;
    total: number;
    remaining: number;
    disabled: boolean;
}

export const PLACEABLE_ORDER: PlaceableKind[] = [
    PlaceableKind.START,
    PlaceableKind.FLAG,
    PlaceableKind.FIGHT,
    PlaceableKind.HEAL,
    PlaceableKind.BOAT,
];
