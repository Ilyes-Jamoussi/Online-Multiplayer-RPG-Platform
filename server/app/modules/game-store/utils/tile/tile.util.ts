import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { MapSize } from '@common/enums/map-size.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

export function makeDefaultTiles(size: MapSize): Tile[] {
    const out: Tile[] = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            out.push({
                x,
                y,
                kind: TileKind.BASE,
            });
        }
    }
    return out;
}
