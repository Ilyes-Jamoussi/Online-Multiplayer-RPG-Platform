import { MapSize } from '@common/enums/map-size.enum';
import { Avatar } from '../enums/avatar.enum';
import { InGamePlayer, Player } from './player.interface';
import { GameMode } from '@common/enums/game-mode.enum';
import { StartPoint } from './start-point.interface';
import { TurnState } from './turn-state.interface';

export interface AvatarAssignment {
    avatar: Avatar;
    chosenBy: string | null;
}

export interface BaseSession {
    id: string;
    gameId: string;
    maxPlayers: number;
}

export interface WaitingRoomSession extends BaseSession {
    players: Player[];
    avatarAssignments: AvatarAssignment[];
    isRoomLocked: boolean;
}

export interface InGameSession extends BaseSession {
    inGameId: string;
    isGameStarted: boolean;
    inGamePlayers: Record<string, InGamePlayer>;
    currentTurn: TurnState;
    startPoints: StartPoint[];
    mapSize: MapSize;
    mode: GameMode;
    turnOrder: string[];
}
