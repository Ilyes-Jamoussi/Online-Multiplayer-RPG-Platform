import { Avatar } from '@common/enums/avatar.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Tile } from '@common/interfaces/tile.interface';
import { Player } from '@common/models/player.model';
import { ItemContainer } from '../interfaces/item-container.interface';

export interface AvatarAssignment {
    avatar: Avatar;
    chosenBy: string | null;
}

export interface Session {
    id: string;
    players: Player[];
    avatarAssignments: AvatarAssignment[];
    isRoomLocked: boolean;

    gameInitializationData: {
        map: Tile[][];
        itemContainers: ItemContainer[];
        mapSize: MapSize;
    };
}
