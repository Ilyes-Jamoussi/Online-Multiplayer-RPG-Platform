export enum MapSize {
    Small = 10,
    Medium = 15,
    Large = 20,
}

export const MAP_SIZE_TO_MAX_PLAYERS: Record<MapSize, number> = {
    [MapSize.Small]: 2,
    [MapSize.Medium]: 4,
    [MapSize.Large]: 6,
};
