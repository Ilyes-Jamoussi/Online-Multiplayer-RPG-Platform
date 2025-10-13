import { DEFAULT_AVATAR_ASSIGNMENTS } from '@common/constants/default-avatar-assignments.constants';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { InGameSession, Session } from '@common/models/session.interface';

export const MIN_SESSION_PLAYERS = 2;

export const DEFAULT_SESSION: Session = {
    id: '',
    gameId: '',
    maxPlayers: 0,
    players: [],
    avatarAssignments: DEFAULT_AVATAR_ASSIGNMENTS,
    isRoomLocked: false,
};

export const DEFAULT_IN_GAME_SESSION: InGameSession = {
    id: '',
    gameId: '',
    sessionId: '',
    mapSize: MapSize.SMALL,
    mode: GameMode.CLASSIC,
    players: [],
    startPoints: [],
    turnOrderIndex: [],
    currentTurnIndex: 0,
    currentTurn: 0,
    activePlayerId: '',
};
