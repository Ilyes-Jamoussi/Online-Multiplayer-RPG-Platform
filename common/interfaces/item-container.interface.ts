import { ItemType } from '../enums/item-type.enum';

export interface ItemContainer {
    item: ItemType;
    count: number;
}
