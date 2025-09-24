import { MapSize } from '@common/enums/map-size.enum';

export const DEFAULT_DRAFT_GAME_NAME = 'Jeu';
export const DEFAULT_DRAFT_GAME_DESCRIPTION = 'Description du jeu...';

export const MAP_SIZE_LABELS: Record<MapSize, string> = {
    [MapSize.SMALL]: 'Petit : 10x10',
    [MapSize.MEDIUM]: 'Moyen : 15x15',
    [MapSize.LARGE]: 'Grand : 20x20',
};
