export enum MapSize {
    SMALL = 10,
    MEDIUM = 15,
    LARGE = 20,
}

export const MAP_SIZE_TO_MAX_PLAYERS: Record<MapSize, number> = {
    [MapSize.SMALL]: 2,
    [MapSize.MEDIUM]: 4,
    [MapSize.LARGE]: 6,
};
