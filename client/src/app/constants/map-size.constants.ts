import { MapSize } from '@common/enums/map-size.enum';

export const MAP_SIZE_TO_MAX_PLAYERS: Record<MapSize, number> = {
    [MapSize.SMALL]: 2,
    [MapSize.MEDIUM]: 4,
    [MapSize.LARGE]: 6,
};
