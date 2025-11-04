export enum PlaceableKind {
    START = 'START',
    FLAG = 'FLAG',
    HEAL = 'HEAL',
    FIGHT = 'FIGHT',
    BOAT = 'BOAT',
}

export enum PlaceableFootprint {
    START = 1,
    FLAG = 1,
    HEAL = 2,
    FIGHT = 2,
    BOAT = 1,
}

export const PlaceableDisabled: Record<PlaceableKind, boolean> = {
    [PlaceableKind.START]: false,
    [PlaceableKind.FLAG]: false,
    [PlaceableKind.HEAL]: true,
    [PlaceableKind.FIGHT]: true,
    [PlaceableKind.BOAT]: true,
};
