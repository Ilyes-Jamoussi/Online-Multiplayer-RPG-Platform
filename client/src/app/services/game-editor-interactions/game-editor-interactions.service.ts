import { Injectable, signal } from '@angular/core';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { TileKind } from '@common/enums/tile-kind.enum';

export enum ToolType {
    TileBrushTool = 'tile-brush-tool',
    PlaceableTool = 'placeable-tool',
}

export type TileBrushTool = {
    type: ToolType.TileBrushTool;
    tileKind: TileKind;
    leftDrag: boolean;
    rightDrag: boolean;
};

export type PlaceableTool = {
    type: ToolType.PlaceableTool;
    placeableKind: string;
};

export type ActiveTool = TileBrushTool | PlaceableTool;

@Injectable({ providedIn: 'root' })
export class GameEditorInteractionsService {
    constructor(private readonly store: GameEditorStoreService) {}

    private readonly _activeTool = signal<ActiveTool | null>(null);
    private readonly _previousActiveTool = signal<ActiveTool | null>(null);

    get activeTool() {
        return this._activeTool.asReadonly();
    }

    setActiveTool(tool: ActiveTool): void {
        this._previousActiveTool.set(this._activeTool());
        this._activeTool.set(tool);
    }

    revertToPreviousTool(): void {
        this._activeTool.set(this._previousActiveTool());
        this._previousActiveTool.set(null);
    }

    dragStart(x: number, y: number, click: 'left' | 'right'): void {
        const tool = this._activeTool();
        if (!tool || tool.type !== ToolType.TileBrushTool) return;
        this._activeTool.set({
            ...tool,
            leftDrag: click === 'left' ? true : tool.leftDrag,
            rightDrag: click === 'right' ? true : tool.rightDrag,
        });

        this.tilePaint(x, y);
    }

    dragEnd(): void {
        const tool = this._activeTool();
        if (!tool || tool.type !== ToolType.TileBrushTool) return;
        this._activeTool.set({
            ...tool,
            leftDrag: false,
            rightDrag: false,
        });
    }

    tilePaint(x: number, y: number): void {
        const tool = this._activeTool();
        if (!tool || tool.type !== ToolType.TileBrushTool) return;
        if (!tool.leftDrag && !tool.rightDrag) return;
        this.store.setTileAt(x, y, tool.rightDrag ? TileKind.BASE : tool.tileKind);
    }
}
