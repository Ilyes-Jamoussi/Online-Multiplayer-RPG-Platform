import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { MapSize } from '@common/enums/map-size.enum';

export interface GameMap {
    tiles: (Tile & { playerId: string | null })[];
    objects: Placeable[];
    size: MapSize;
}
