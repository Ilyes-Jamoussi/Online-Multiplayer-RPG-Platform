import { PlaceableKind } from '@common/enums/placeable-kind.enum';

export const PLACEABLE_DISABLED: Record<PlaceableKind, boolean> = {
    [PlaceableKind.START]: false,
    [PlaceableKind.FLAG]: false,
    [PlaceableKind.HEAL]: false,
    [PlaceableKind.FIGHT]: false,
    [PlaceableKind.BOAT]: false,
};
