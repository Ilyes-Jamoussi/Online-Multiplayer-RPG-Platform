import { MapSize } from '@common/enums/map-size.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { makeDefaultTiles } from './tile.util';

describe('tile.factory', () => {
    it('creates a square grid of tiles for each MapSize with correct coordinates and kind', () => {
        const sizes = Object.values(MapSize).filter((v) => typeof v === 'number') as unknown as MapSize[];

        for (const size of sizes) {
            const out = makeDefaultTiles(size);

            const expectedTotal = size * size;
            expect(out.length).toBe(expectedTotal);

            const seen = new Set<string>();
            for (const tile of out) {
                expect(typeof tile.x).toBe('number');
                expect(typeof tile.y).toBe('number');
                expect(tile.kind).toBe(TileKind.BASE);
                expect(tile.x).toBeGreaterThanOrEqual(0);
                expect(tile.x).toBeLessThan(size);
                expect(tile.y).toBeGreaterThanOrEqual(0);
                expect(tile.y).toBeLessThan(size);

                const key = `${tile.x},${tile.y}`;
                expect(seen.has(key)).toBe(false);
                seen.add(key);
            }

            expect(seen.size).toBe(expectedTotal);
        }
    });
});
