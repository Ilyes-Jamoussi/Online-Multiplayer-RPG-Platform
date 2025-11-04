import { PlaceableKind } from '@common/enums/placeable-kind.enum';

export const PLACEABLE_DISABLED: Record<PlaceableKind, boolean> = {
    [PlaceableKind.START]: false,
    [PlaceableKind.FLAG]: false,
    [PlaceableKind.HEAL]: true,
    [PlaceableKind.FIGHT]: true,
    [PlaceableKind.BOAT]: true,
};
