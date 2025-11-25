import { MapSize } from '@common/enums/map-size.enum';
import { Avatar } from '../enums/avatar.enum';
import { Player } from './player.interface';
import { GameMode } from '@common/enums/game-mode.enum';
import { StartPoint } from './start-point.interface';
import { TurnState } from './turn-state.interface';
import { Team } from './team.interface';
import { FlagData } from './flag-data.interface';

export interface AvatarAssignment {
    avatar: Avatar;
    chosenBy: string | null;
}

export interface BaseSession {
    id: string;
    gameId: string;
    maxPlayers: number;
    mode: GameMode;
}

export interface WaitingRoomSession extends BaseSession {
    players: Player[];
    avatarAssignments: AvatarAssignment[];
    isRoomLocked: boolean;
    chatId: string;
}

export interface InGameSession extends BaseSession {
    inGameId: string;
    isGameStarted: boolean;
    inGamePlayers: Record<string, Player>;
    teams: Record<number, Team>;
    currentTurn: TurnState;
    startPoints: StartPoint[];
    mapSize: MapSize;
    turnOrder: string[];
    isAdminModeActive?: boolean;
    gameStartTime?: Date;
    playerCount: number;
    flagData?: FlagData;
}
