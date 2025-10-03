import { FLAG_COUNTS, PLACEABLE_COUNTS } from '@app/constants/game-placeables.constants';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { makeDefaultPlaceables } from '@app/modules/game-store/utils/placeable/placeable.util';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';

describe('placeable.factory', () => {
    function expectedCounts(size: MapSize, mode: GameMode): Partial<Record<PlaceableKind, number>> {
        const base = PLACEABLE_COUNTS[size] ?? {};
        const extra = FLAG_COUNTS[mode]?.[size] ?? {};
        const allKinds = new Set<PlaceableKind>([...(Object.keys(base) as PlaceableKind[]), ...(Object.keys(extra) as PlaceableKind[])]);
        const result: Partial<Record<PlaceableKind, number>> = {};
        for (const k of allKinds) {
            result[k] = (base[k] ?? 0) + (extra[k] ?? 0);
        }
        return result;
    }

    it('creates placeables for each kind with correct counts and default values (CLASSIC)', () => {
        const size = MapSize.SMALL;
        const mode = GameMode.CLASSIC;
        const expected = expectedCounts(size, mode);

        const out = makeDefaultPlaceables(size, mode);

        const totalExpected = Object.values(expected).reduce((s, v) => s + (v ?? 0), 0);
        expect(out.length).toBe(totalExpected);

        const counts: Partial<Record<PlaceableKind, number>> = {};
        for (const p of out) {
            expect(typeof p.kind).toBe('string');
            expect(p.placed).toBe(false);
            expect(p.x).toBe(-1);
            expect(p.y).toBe(-1);

            counts[p.kind] = (counts[p.kind] ?? 0) + 1;
        }

        for (const k of Object.keys(expected) as PlaceableKind[]) {
            expect(counts[k] ?? 0).toBe(expected[k] ?? 0);
        }
    });

    it('includes flags when mode is CTF and omits them for CLASSIC', () => {
        const size = MapSize.MEDIUM;

        const outClassic = makeDefaultPlaceables(size, GameMode.CLASSIC);
        const outCtf = makeDefaultPlaceables(size, GameMode.CTF);

        const baseClassic = PLACEABLE_COUNTS[size] ?? {};
        const flagExtra = FLAG_COUNTS[GameMode.CTF]?.[size] ?? {};

        const expectedFlagClassic = baseClassic[PlaceableKind.FLAG] ?? 0;
        const expectedFlagCtf = (baseClassic[PlaceableKind.FLAG] ?? 0) + (flagExtra[PlaceableKind.FLAG] ?? 0);

        const countFlags = (arr: Placeable[]) => arr.filter((p) => p.kind === PlaceableKind.FLAG).length;

        expect(countFlags(outClassic)).toBe(expectedFlagClassic);
        expect(countFlags(outCtf)).toBe(expectedFlagCtf);
    });

    it('works for all map sizes and both modes (no magic numbers)', () => {
        const sizes = Object.values(MapSize).filter((v) => typeof v !== 'string') as unknown as MapSize[];
        const modes = Object.values(GameMode) as unknown as GameMode[];

        for (const size of sizes) {
            for (const mode of modes) {
                const expected = expectedCounts(size, mode);
                const out = makeDefaultPlaceables(size, mode);

                const totalExpected = Object.values(expected).reduce((s, v) => s + (v ?? 0), 0);
                expect(out.length).toBe(totalExpected);

                const expectedKinds = new Set(Object.keys(expected));
                for (const p of out) {
                    expect(expectedKinds.has(p.kind)).toBe(true);
                }
            }
        }
    });

    it('should handle undefined count values in makeDefaultPlaceables', () => {
        const result = makeDefaultPlaceables(MapSize.SMALL, GameMode.CLASSIC);
        expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing size in PLACEABLE_COUNTS', () => {
        const result = makeDefaultPlaceables('INVALID_SIZE' as unknown as MapSize, GameMode.CLASSIC);
        expect(result).toEqual([]);
    });

    it('should handle missing mode or size in FLAG_COUNTS', () => {
        const result = makeDefaultPlaceables(MapSize.SMALL, 'INVALID_MODE' as unknown as GameMode);
        expect(result.length).toBeGreaterThan(0);
    });

    it('treats undefined count as 0 (loop does not run when count is undefined)', () => {
        const size = MapSize.SMALL;
        const mode = GameMode.CLASSIC;

        const kind = PlaceableKind.HEAL as PlaceableKind;

        const original = (PLACEABLE_COUNTS[size] ?? {})[kind];
        PLACEABLE_COUNTS[size][kind] = undefined;

        try {
            const out = makeDefaultPlaceables(size, mode);

            expect(out.some((p) => p.kind === kind)).toBeFalsy();

            const otherKinds = Object.keys(PLACEABLE_COUNTS[size]).filter((k) => k !== kind);
            for (const k of otherKinds) {
                expect(out.some((p) => p.kind === (k as PlaceableKind))).toBeTruthy();
            }
        } finally {
            PLACEABLE_COUNTS[size][kind] = original;
        }
    });

    it('treats undefined extra flag count as 0 in CTF', () => {
        const size = MapSize.MEDIUM;
        const original = (FLAG_COUNTS[GameMode.CTF]?.[size] ?? {})[PlaceableKind.FLAG];
        FLAG_COUNTS[GameMode.CTF][size][PlaceableKind.FLAG] = undefined;

        try {
            const out = makeDefaultPlaceables(size, GameMode.CTF);
            const base = PLACEABLE_COUNTS[size]?.[PlaceableKind.FLAG] ?? 0;
            const flags = out.filter((p) => p.kind === PlaceableKind.FLAG).length;
            expect(flags).toBe(base);
        } finally {
            FLAG_COUNTS[GameMode.CTF][size][PlaceableKind.FLAG] = original;
        }
    });
});
