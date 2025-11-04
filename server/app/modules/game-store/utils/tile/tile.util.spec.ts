import { MapSize } from '@common/enums/map-size.enum';
import { TileKind } from '@common/enums/tile.enum';
import { makeDefaultTiles } from './tile.util';

describe('tile.factory', () => {
    it('creates a square grid of tiles for each MapSize with correct coordinates and kind', () => {
        const sizes = Object.values(MapSize).filter((v) => typeof v === 'number') as unknown as MapSize[];

        for (const size of sizes) {
            const out = makeDefaultTiles(size);

            const expectedTotal = size * size;
            expect(out.length).toBe(expectedTotal);

            const seen = new Set<string>();
            for (const t of out) {
                expect(typeof t.x).toBe('number');
                expect(typeof t.y).toBe('number');
                expect(t.kind).toBe(TileKind.BASE);
                expect(t.x).toBeGreaterThanOrEqual(0);
                expect(t.x).toBeLessThan(size);
                expect(t.y).toBeGreaterThanOrEqual(0);
                expect(t.y).toBeLessThan(size);

                const key = `${t.x},${t.y}`;
                expect(seen.has(key)).toBe(false);
                seen.add(key);
            }

            expect(seen.size).toBe(expectedTotal);
        }
    });
});
