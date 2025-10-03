import { ItemType } from '@common/enums/item-type.enum';
import { TileType } from '@common/enums/tile-type.enum';

export interface Tile {
    type: TileType;
    doorState?: 'open' | 'closed';
    item: ItemType | null;
}
