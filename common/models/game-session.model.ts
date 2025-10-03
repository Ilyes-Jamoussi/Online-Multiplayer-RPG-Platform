import { MapSize } from '@common/enums/map-size.enum';
import { BoardTile } from '@common/interfaces/board-tile.interface';
import { Player } from './player.model';

export interface GameSession {
    mapSize: MapSize;
    board: BoardTile[][];
    players: Player[];
}
