import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { TeleportChannelDto } from '@app/dto/teleport-channel-dto';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';

export enum ToolType {
    TileBrushTool = 'tile-brush-tool',
    PlaceableTool = 'placeable-tool',
    PlaceableEraserTool = 'placeable-eraser-tool',
    TeleportTileTool = 'teleport-tile-tool',
}

export enum GameEditorIssuesEnum {
    TerrainCoverage = 'terrainCoverage',
    Doors = 'doors',
    TerrainAccessibility = 'terrainAccessibility',
    StartPlacement = 'startPlacement',
    FlagPlacement = 'flagPlacement',
    NameValidation = 'nameValidation',
    DescriptionValidation = 'descriptionValidation',
}

export type GameEditorIssues = {
    [GameEditorIssuesEnum.TerrainCoverage]: GameEditorIssue;
    [GameEditorIssuesEnum.Doors]: AccesibilityIssue;
    [GameEditorIssuesEnum.TerrainAccessibility]: AccesibilityIssue;
    [GameEditorIssuesEnum.StartPlacement]: GameEditorIssue;
    [GameEditorIssuesEnum.FlagPlacement]: GameEditorIssue;
    [GameEditorIssuesEnum.NameValidation]: GameEditorIssue;
    [GameEditorIssuesEnum.DescriptionValidation]: GameEditorIssue;
};
export interface GameEditorIssue {
    message?: string;
    hasIssue: boolean;
}
export interface AccesibilityIssue extends GameEditorIssue {
    tiles: Vector2[];
}

export type Inventory = {
    [key in PlaceableKind]: InventoryItem;
};

interface InventoryItem {
    kind: PlaceableKind;
    total: number;
    remaining: number;
    disabled: boolean;
    image: string;
}

export interface TileBrushTool {
    type: ToolType.TileBrushTool;
    tileKind: TileKind;
    leftDrag: boolean;
    rightDrag: boolean;
}

export interface TeleportTileTool {
    type: ToolType.TeleportTileTool;
    channelNumber: number;
    teleportChannel: TeleportChannelDto;
    firstTilePlaced?: Vector2;
}

interface PlaceableTool {
    type: ToolType.PlaceableTool;
    placeableKind: PlaceableKind;
}

interface PlaceableEraserTool {
    type: ToolType.PlaceableEraserTool;
}

export type ActiveTool = TileBrushTool | TeleportTileTool | PlaceableTool | PlaceableEraserTool;

export interface Vector2 {
    x: number;
    y: number;
}

export interface ExtendedGameEditorPlaceableDto extends GameEditorPlaceableDto {
    xPositions: number[];
    yPositions: number[];
}

export type ToolbarItem = {
    image: string;
    tileKind: TileKind;
    class: string;
};

export interface TeleportChannel {
    channelNumber: number;
    tiles: {
        a: Vector2;
        b: Vector2;
    };
}