import { Position } from '@common/interfaces/position.interface';

export interface PlaceableDisabledUpdatedDto {
    placeableId?: string;
    positions: Position[];
    turnCount: number;
}
