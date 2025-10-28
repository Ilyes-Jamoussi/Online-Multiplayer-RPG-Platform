export enum TileKind {
    WATER = 'WATER',
    WALL = 'WALL',
    ICE = 'ICE',
    DOOR = 'DOOR',
    BASE = 'BASE',
    TELEPORT = 'TELEPORT',
}

export enum TileLabel {
    WATER = 'Eau',
    WALL = 'Mur',
    ICE = 'Glace',
    DOOR = 'Porte',
    BASE = 'Base',
    TELEPORT = 'Téléporteur',
}

export enum TileCost {
    WALL = -1,
    DOOR = -1,
    ICE = 0,
    BASE = 1,
    DOOR_OPEN = 1,
    WATER = 2,
    TELEPORT = 0,
}
