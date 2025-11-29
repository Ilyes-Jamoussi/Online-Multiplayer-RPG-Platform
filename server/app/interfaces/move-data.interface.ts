import { Position } from '@common/interfaces/position.interface';
import { Tile } from '@app/modules/game-store/entities/tile.entity';

export interface MoveData {
    nextPosition: Position;
    tile: Tile;
    moveCost: number;
    isOnBoat: boolean;
    originX: number;
    originY: number;
}
