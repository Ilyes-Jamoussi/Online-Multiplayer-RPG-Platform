import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

export interface MapSizeOption {
    value: MapSize;
    label: string;
    maxPlayers: number;
}

export interface GameModeOption {
    value: GameMode;
    label: string;
    description: string;
}
