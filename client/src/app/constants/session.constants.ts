import { DEFAULT_AVATAR_ASSIGNMENTS } from '@common/constants/default-avatar-assignments.constants';
import { Session } from '@common/models/session.interface';

export const MIN_SESSION_PLAYERS = 2;

export const DEFAULT_SESSION: Session = {
    id: '',
    gameId: '',
    maxPlayers: 0,
    players: [],
    avatarAssignments: DEFAULT_AVATAR_ASSIGNMENTS,
    isRoomLocked: false,
};
