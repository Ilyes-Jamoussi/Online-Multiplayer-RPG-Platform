import { GameEditorPlaceableDto } from '@app/dto/gameEditorPlaceableDto';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

export enum ToolType {
    TileBrushTool = 'tile-brush-tool',
    PlaceableTool = 'placeable-tool',
    PlaceableEraserTool = 'placeable-eraser-tool',
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

export interface InventoryItem {
    kind: PlaceableKind;
    total: number;
    remaining: number;
    disabled: boolean;
}

export const PLACEABLE_ORDER: PlaceableKind[] = [
    PlaceableKind.START,
    PlaceableKind.FLAG,
    PlaceableKind.FIGHT,
    PlaceableKind.HEAL,
    PlaceableKind.BOAT,
];

export interface TileBrushTool {
    type: ToolType.TileBrushTool;
    tileKind: TileKind;
    leftDrag: boolean;
    rightDrag: boolean;
}

export interface PlaceableTool {
    type: ToolType.PlaceableTool;
    placeableKind: PlaceableKind;
}

export interface PlaceableEraserTool {
    type: ToolType.PlaceableEraserTool;
}

export type ActiveTool = TileBrushTool | PlaceableTool | PlaceableEraserTool;

export interface Vector2 {
    x: number;
    y: number;
}

export interface ExtendedGameEditorPlaceableDto extends GameEditorPlaceableDto {
    xs: number[];
    ys: number[];
}

export type ToolbarItem = {
    image: string;
    tileKind: TileKind;
    class: string;
};
