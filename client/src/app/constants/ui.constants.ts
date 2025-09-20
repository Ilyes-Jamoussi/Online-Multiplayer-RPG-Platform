export const UI_CONSTANTS = {
    select: {
        base36: 36,
        randomMultiplier: 1000,
    },
    draggablePanel: {
        initialX: 120,
        initialY: 32,
        zIndex: 1000,
    },
    characterCreation: {
        baseAttributeValue: 10,
        bonusAttributeValue: 2,
        probabilityThreshold: 0.5,
    },
} as const;

export enum TileImage {
    BASE = '/assets/tiles/sand.png',
    WALL = '/assets/tiles/wall.png',
    DOOR = '/assets/tiles/closed-door.png',
    WATER = '/assets/tiles/water.png',
    ICE = '/assets/tiles/ice.png',
    TELEPORT = '/assets/tiles/teleport-portal.png',
}
