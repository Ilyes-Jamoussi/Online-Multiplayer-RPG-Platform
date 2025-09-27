import { GameEditorPlaceableDto } from '@app/dto/gameEditorPlaceableDto';
import { ToolType } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

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
    [GameEditorIssuesEnum.TerrainCoverage]: EditorIssue;
    [GameEditorIssuesEnum.Doors]: AccesibilityIssue;
    [GameEditorIssuesEnum.TerrainAccessibility]: AccesibilityIssue;
    [GameEditorIssuesEnum.StartPlacement]: EditorIssue;
    [GameEditorIssuesEnum.FlagPlacement]: EditorIssue;
    [GameEditorIssuesEnum.NameValidation]: EditorIssue;
    [GameEditorIssuesEnum.DescriptionValidation]: EditorIssue;
};
export interface EditorIssue {
    message?: string;
    hasIssue: boolean;
}
export interface AccesibilityIssue extends EditorIssue {
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
