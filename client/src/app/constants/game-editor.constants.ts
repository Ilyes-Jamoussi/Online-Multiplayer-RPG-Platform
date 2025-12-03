import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

import { PlaceableKind } from '@common/enums/placeable-kind.enum';

export const MIN_TERRAIN_RATIO = 0.5;
export const PERCENT_BASE = 100;

export const PLACEABLE_ORDER: PlaceableKind[] = [
    PlaceableKind.START,
    PlaceableKind.FLAG,
    PlaceableKind.FIGHT,
    PlaceableKind.HEAL,
    PlaceableKind.BOAT,
];

export const DEFAULT_GAME_EDITOR_DTO: GameEditorDto = {
    id: '',
    name: '',
    description: '',
    size: MapSize.MEDIUM,
    mode: GameMode.CLASSIC,
    tiles: [],
    objects: [],
    lastModified: new Date().toISOString(),
    gridPreviewUrl: '',
    teleportChannels: [],
};
