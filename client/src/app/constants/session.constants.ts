import { DEFAULT_AVATAR_ASSIGNMENTS } from '@common/constants/default-avatar-assignments.constants';
import { MapSize } from '@common/enums/map-size.enum';
import { Session } from '@common/models/session.model';

export const MIN_SESSION_PLAYERS = 2;
export const MAX_SESSION_PLAYERS = 4;

export const DEFAULT_SESSION: Session = {
    id: '',
    players: [],
    avatarAssignments: DEFAULT_AVATAR_ASSIGNMENTS,
    isRoomLocked: false,
    gameInitializationData: {
        map: [],
        itemContainers: [],
        mapSize: MapSize.SMALL,
    },
};
