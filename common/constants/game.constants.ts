import { MapSize } from '@common/enums/map-size.enum';

export const DEFAULT_DRAFT_GAME_NAME = 'Name...';
export const DEFAULT_DRAFT_GAME_DESCRIPTION = 'Game description...';
export const BOAT_SPEED_BONUS = 4;

export const MAP_SIZE_LABELS: Record<MapSize, string> = {
    [MapSize.SMALL]: 'Small: 10x10',
    [MapSize.MEDIUM]: 'Medium: 15x15',
    [MapSize.LARGE]: 'Large: 20x20',
};
