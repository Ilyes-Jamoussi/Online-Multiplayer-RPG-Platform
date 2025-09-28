import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { FLAG_COUNTS, PLACEABLE_COUNTS } from '@app/game-store/config/game.config';
import { Placeable } from '@app/game-store/entities/placeable.entity';

function mergeCounts(size: MapSize, mode: GameMode) {
    const base = PLACEABLE_COUNTS[size] ?? {};
    const extra = FLAG_COUNTS[mode]?.[size] ?? {};
    const allKinds = new Set<PlaceableKind>([...(Object.keys(base) as PlaceableKind[]), ...(Object.keys(extra) as PlaceableKind[])]);

    const result: Partial<Record<PlaceableKind, number>> = {};
    for (const k of allKinds) {
        result[k] = (base[k] ?? 0) + (extra[k] ?? 0);
    }
    return result;
}

export function makeDefaultPlaceables(size: MapSize, mode: GameMode): Placeable[] {
    const counts = mergeCounts(size, mode);
    const out: Placeable[] = [];

    for (const [kindStr, count] of Object.entries(counts)) {
        const kind = kindStr as PlaceableKind;
        for (let i = 0; i < (count ?? 0); i++) {
            out.push({ kind, placed: false, x: -1, y: -1 });
        }
    }
    return out;
}
