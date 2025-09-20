import { TileKind } from '@common/enums/tile-kind.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { GameMode } from '@common/enums/game-mode.enum';

export type SizePreset = 's' | 'm' | 'l';

export interface MapObjects {
    startPoints: number;
    flags: number;
    heal: number;
    fight: number;
    teleports: number;
    boats: number;
}

export interface MapDimensions {
    width: number;
    height: number;
}

export const sizePresets: Record<
    SizePreset,
    {
        dimensions: MapDimensions;
        objects: MapObjects;
    }
> = {
    s: {
        dimensions: { width: 10, height: 10 },
        objects: {
            startPoints: 2,
            flags: 1,
            heal: 1,
            fight: 1,
            teleports: 1,
            boats: 1,
        },
    },
    m: {
        dimensions: { width: 15, height: 15 },
        objects: {
            startPoints: 4,
            flags: 2,
            heal: 2,
            fight: 2,
            teleports: 2,
            boats: 2,
        },
    },
    l: {
        dimensions: { width: 20, height: 20 },
        objects: {
            startPoints: 6,
            flags: 4,
            heal: 4,
            fight: 4,
            teleports: 4,
            boats: 4,
        },
    },
};

// export interface TileSpec extends Omit<ReadTileDto, 'x' | 'y' | 'id'> {
//     x?: number;
//     y?: number;
//     id?: string;
// }

export type ObjectId = string;

// export interface PlaceableBase {
//     id: ObjectId;
//     kind: PlaceableKind;
//     label?: string;
//     orientation?: Orientation;
// }
// export type PlaceableObject =
//     | (PlaceableBase & { kind: PlaceableKind.START })
//     | (PlaceableBase & { kind: PlaceableKind.FLAG })
//     | (PlaceableBase & { kind: PlaceableKind.HEAL })
//     | (PlaceableBase & { kind: PlaceableKind.FIGHT })
//     | (PlaceableBase & { kind: PlaceableKind.BOAT });

// export type PlaceableObject = ReadPlaceableDto;

// export interface Objects {
//     byId: Record<ObjectId, PlaceableObject>;
// }

// export interface Grid {
//     width: number;
//     height: number;
//     tiles: TileSpec[];
//     objectIds: (ObjectId | null)[];
// }

// export interface Footprint {
//     w: number;
//     h: number;
// }

// export const footprintOf = (k: ReadPlaceableDto.KindEnum): Footprint =>
//     k === PlaceableKind.HEAL || k === PlaceableKind.FIGHT ? { w: 2, h: 2 } : { w: 1, h: 1 };

export interface GameMeta {
    id?: string;
    name: string;
    description: string;
    sizePreset: SizePreset;
    mode: GameMode;
}

export interface InventorySpec {
    allowance: Partial<Record<PlaceableKind, number>>;
}
export interface InventoryState {
    available: Record<PlaceableKind, number>;
}

// export interface EditorState {
//     activeTool: ActiveTool;
//     tileSize: number;
//     stagingTeleport?: { pairId: string; firstIndex: number; underTile: TileSpec; label: string };
// }

// export interface GameDraft {
//     meta: GameMeta;
//     grid: Grid;
//     objects: Objects;
//     inventory: InventoryState;
//     todo : implement teleports
//     teleports?: something
//     editor: EditorState;
// }

/** 👉 Outils actifs */
export type TileBrushTool = {
    type: 'TILE_BRUSH';
    tile: TileKind;
    leftDrag?: boolean;
    rightDrag?: boolean;
};

export type ObjectTool = {
    type: 'OBJECT';
    kind: PlaceableKind;
};

export type PickerTool = {
    type: 'PICK_TILE';
};

export type ActiveTool = TileBrushTool | ObjectTool | PickerTool;

export enum ToolType {
    TileBrush = 'TILE_BRUSH',
    Object = 'OBJECT',
    PickTile = 'PICK_TILE',
}

export interface TileActions {
    leftClick: (x: number, y: number) => void;
    rightClick: (x: number, y: number) => void;
    dragStart?: (click: 'left' | 'right') => void;
    dragEnd?: (click: 'left' | 'right') => void;
    dragPaint?: (x: number, y: number) => void;
}

export const DND_MIME = 'application/x-placeable-kind';
