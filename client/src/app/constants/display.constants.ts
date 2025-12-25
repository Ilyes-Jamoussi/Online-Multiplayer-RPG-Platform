import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';

export const MAP_SIZE_DISPLAY: Record<MapSize, string> = {
    [MapSize.SMALL]: 'Small',
    [MapSize.MEDIUM]: 'Medium',
    [MapSize.LARGE]: 'Large',
};

export const GAME_MODE_DISPLAY: Record<GameMode, string> = {
    [GameMode.CLASSIC]: 'Classic',
    [GameMode.CTF]: 'Capture the Flag',
};
