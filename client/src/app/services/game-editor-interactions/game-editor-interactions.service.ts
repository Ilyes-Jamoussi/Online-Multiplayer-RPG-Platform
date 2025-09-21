import { Injectable, signal } from '@angular/core';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { PlaceableMime, PlaceableKind, PlaceableFootprint } from '@common/enums/placeable-kind.enum';
// import { PlaceableFootprint, PlaceableKind, PlaceableMime } from '@common/enums/placeable-kind.enum';
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

    resolveDropAction(evt: DragEvent, x: number, y: number): void {
        if (evt && evt.dataTransfer) {
            const mime = Object.values(PlaceableMime).find((m) => evt.dataTransfer?.types.includes(m));
            if (!mime) return;
            const data = evt.dataTransfer.getData(mime);
            if (!data) return;
            if (Object.values(PlaceableKind).includes(data as PlaceableKind)) {
                this.tryPlaceObject(x, y, data as PlaceableKind);
            } else {
                this.tryMoveObject(x, y, data);
            }
        }
    }

    removeObject(id: string): void {
        this.store.removeObject(id);
    }

    // can only place object if :
    // - tile is not wall or water or door
    // - tile is not already occupied by another object
    // - PlaceableKind boat can only be placed on water tiles

    private canPlaceObject(x: number, y: number, kind: PlaceableKind): boolean {
        const tile = this.store.getTileAt(x, y);
        const footprint = PlaceableFootprint[kind];

        // if footprint = 2 need to checkl 2x2 area
        // etc...

        if (!tile) return false;

        if ([TileKind.WALL, TileKind.DOOR].includes(TileKind[tile.kind])) return false;
        if (tile.kind === TileKind.WATER && kind !== PlaceableKind.BOAT) return false;

        // Check if tile is already occupied
        if (this.store.getPlacedObjectAt(x, y)) return false;
        if (footprint === 2) {
            if (this.store.getPlacedObjectAt(x + 1, y)) return false;
            if (this.store.getPlacedObjectAt(x, y + 1)) return false;
            if (this.store.getPlacedObjectAt(x + 1, y + 1)) return false;
        }

        // Check specific rules for PlaceableKind
        if (kind === PlaceableKind.BOAT && tile.kind !== TileKind.WATER) return false;

        return true;
    }

    private tryPlaceObject(x: number, y: number, kind: PlaceableKind): void {
        if (kind === PlaceableKind.HEAL || kind === PlaceableKind.FIGHT) return;
        const canPlace = this.canPlaceObject(x, y, kind);
        if (!canPlace) return;
        this.store.placeObject(kind, x, y);
    }

    private tryMoveObject(x: number, y: number, id: string): void {
        const obj = this.store.placedObjects().find((o) => o.id === id);
        if (!obj) return;
        const canPlace = this.canPlaceObject(x, y, PlaceableKind[obj.kind]);
        if (!canPlace) return;
        this.store.moveObject(id, x, y);
    }
}
