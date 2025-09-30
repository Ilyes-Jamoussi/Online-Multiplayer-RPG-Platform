import { ModeSizeMatrix } from '@app/types/game-placeables.types';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';

export const PLACEABLE_COUNTS: ModeSizeMatrix = {
    [MapSize.SMALL]: { [PlaceableKind.START]: 2, [PlaceableKind.HEAL]: 1, [PlaceableKind.FIGHT]: 1, [PlaceableKind.BOAT]: 1 },
    [MapSize.MEDIUM]: { [PlaceableKind.START]: 4, [PlaceableKind.HEAL]: 2, [PlaceableKind.FIGHT]: 2, [PlaceableKind.BOAT]: 2 },
    [MapSize.LARGE]: { [PlaceableKind.START]: 6, [PlaceableKind.HEAL]: 4, [PlaceableKind.FIGHT]: 4, [PlaceableKind.BOAT]: 4 },
};

export const FLAG_COUNTS: Record<GameMode, ModeSizeMatrix> = {
    [GameMode.CLASSIC]: {
        [MapSize.SMALL]: {},
        [MapSize.MEDIUM]: {},
        [MapSize.LARGE]: {},
    },
    [GameMode.CTF]: {
        [MapSize.SMALL]: { [PlaceableKind.FLAG]: 1 },
        [MapSize.MEDIUM]: { [PlaceableKind.FLAG]: 1 },
        [MapSize.LARGE]: { [PlaceableKind.FLAG]: 1 },
    },
};
