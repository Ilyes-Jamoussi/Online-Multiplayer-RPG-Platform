import { Tile } from './tile.interface';

export interface BoardTile {
    baseTile: Tile;
    occupantId: string | null;

    isReachable: boolean;
    isInPath: boolean;
    isHighlighted: boolean;
}
