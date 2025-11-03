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

export enum PlaceableMime {
    START = 'application/x-placeable-start',
    FLAG = 'application/x-placeable-flag',
    HEAL = 'application/x-placeable-heal',
    FIGHT = 'application/x-placeable-fight',
    BOAT = 'application/x-placeable-boat',
}

export enum PlaceableLabel {
    START = 'Départ',
    FLAG = 'Drapeau',
    HEAL = 'Sanctuaire Soin',
    FIGHT = 'Sanctuaire Combat',
    BOAT = 'Bateau',
}

export const PlaceableDisabled: Record<PlaceableKind, boolean> = {
    [PlaceableKind.START]: false,
    [PlaceableKind.FLAG]: false,
    [PlaceableKind.HEAL]: true,
    [PlaceableKind.FIGHT]: true,
    [PlaceableKind.BOAT]: true,
};
