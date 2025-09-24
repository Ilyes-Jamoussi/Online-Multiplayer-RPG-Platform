import { ToolType } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

export interface GameEditorIssues {
    terrainCoverage: EditorIssue;
    doors: AccessibilityProblem;
    terrainAccessibility: AccessibilityProblem;
    startPlacement: EditorIssue;
    flagPlacement: EditorIssue;
    nameValidation: EditorIssue;
    descriptionValidation: EditorIssue;
}
export interface EditorIssue {
    message?: string;
    hasIssue: boolean;
}
export interface AccessibilityProblem extends EditorIssue {
    tiles: Vector2[];
}

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

export type ActiveTool = TileBrushTool | PlaceableTool;

export interface Vector2 {
    x: number;
    y: number;
}
