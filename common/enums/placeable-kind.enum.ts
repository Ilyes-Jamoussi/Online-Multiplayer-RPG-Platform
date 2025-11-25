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

export enum PlaceableReachable {
    HEAL = 0,
    FIGHT = 0,
    BOAT = 1,
    FLAG = 0,
    START = 1,
}
