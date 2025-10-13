import { MapSize } from '@common/enums/map-size.enum';
import { Avatar } from '../enums/avatar.enum';
import { InGamePlayer, Player } from './player.interface';
import { GameMode } from '@common/enums/game-mode.enum';

export interface AvatarAssignment {
    avatar: Avatar;
    chosenBy: string | null;
}

export interface Session {
    id: string;
    gameId: string;
    maxPlayers: number;
    players: Player[];
    avatarAssignments: AvatarAssignment[];
    isRoomLocked: boolean;
}

export interface InGameSession {
    id: string;
    gameId: string;
    sessionId: string;
    mapSize: MapSize;
    mode: GameMode;
    players: InGamePlayer[];
    startPoints: {
        x: number;
        y: number;
        id: string;
        playerId: string;
    }[];
    turnOrderIndex: number[];
    currentTurnIndex: number;
    activePlayerId: string;
    currentTurn: number;
}
