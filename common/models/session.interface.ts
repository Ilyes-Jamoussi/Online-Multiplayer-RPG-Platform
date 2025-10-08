import { Avatar } from '@common/enums/avatar.enum';
import { Player } from '@common/models/player.interface';

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
