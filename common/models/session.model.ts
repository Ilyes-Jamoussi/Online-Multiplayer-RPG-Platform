import { AvatarName } from '@common/enums/avatar-name.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { ItemContainer } from '@common/interfaces/item-container.interface';
import { Tile } from '@common/interfaces/tile.interface';
import { Player } from '@common/models/player.model';

export interface AvatarAssignment {
    avatarName: AvatarName;
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
