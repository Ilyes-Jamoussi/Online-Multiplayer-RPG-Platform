import { Avatar } from '../enums/avatar.enum';
import { MapSize } from '../enums/map-size.enum';
// import { ItemContainer } from '../interfaces/item-container.interface';
// import { Tile } from '@common/interfaces/tile.interface';
// import { Player } from '@common/models/player.model';

export interface AvatarAssignment {
    avatarName: Avatar;
    chosenBy: string | null;
}

export interface Session {
    id: string;
    // players: Player[];
    avatarAssignments: AvatarAssignment[];
    isRoomLocked: boolean;

    gameInitializationData: {
        // map: Tile[][];
        // itemContainers: ItemContainer[];
        mapSize: MapSize;
    };
}
