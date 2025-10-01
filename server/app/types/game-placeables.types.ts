import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';

export type SizeCounts = Partial<Record<PlaceableKind, number>>;
export type ModeSizeMatrix = Record<MapSize, SizeCounts>;
