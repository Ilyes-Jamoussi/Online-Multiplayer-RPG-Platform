import { DEFAULT_AVATAR_ASSIGNMENTS } from '@common/constants/default-avatar-assignments.constants';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { InGameSession, WaitingRoomSession } from '@common/interfaces/session.interface';

export const MIN_SESSION_PLAYERS = 2;

export const DEFAULT_SESSION: WaitingRoomSession = {
    id: '',
    gameId: '',
    maxPlayers: 0,
    players: [],
    avatarAssignments: DEFAULT_AVATAR_ASSIGNMENTS,
    isRoomLocked: false,
};

export const DEFAULT_IN_GAME_SESSION: InGameSession = {
    ...DEFAULT_SESSION,
    inGameId: '',
    isGameStarted: false,
    inGamePlayers: {},
    currentTurn: { turnNumber: 0, activePlayerId: '', hasUsedAction: false },
    startPoints: [],
    turnOrder: [],
    mapSize: MapSize.SMALL,
    mode: GameMode.CLASSIC,
};
