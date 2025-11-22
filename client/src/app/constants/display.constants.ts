import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';

export const MAP_SIZE_DISPLAY: Record<MapSize, string> = {
    [MapSize.SMALL]: 'Petite',
    [MapSize.MEDIUM]: 'Moyenne',
    [MapSize.LARGE]: 'Grande',
};

export const GAME_MODE_DISPLAY: Record<GameMode, string> = {
    [GameMode.CLASSIC]: 'Classique',
    [GameMode.CTF]: 'Capture du Drapeau',
};
