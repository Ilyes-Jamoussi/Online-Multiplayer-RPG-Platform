import { Injectable, signal } from '@angular/core';
import { GameEditorPlaceableDto } from '@app/dto/gameEditorPlaceableDto';
import { ActiveTool, Vector2 } from '@app/interfaces/game-editor.interface';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { PlaceableMime, PlaceableKind, PlaceableFootprint } from '@common/enums/placeable-kind.enum';
// import { PlaceableFootprint, PlaceableKind, PlaceableMime } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

export enum ToolType {
    TileBrushTool = 'tile-brush-tool',
    PlaceableTool = 'placeable-tool',
    PlaceableEraserTool = 'placeable-eraser-tool',
}

@Injectable()
export class GameEditorInteractionsService {
    constructor(private readonly store: GameEditorStoreService) {}

    private readonly _activeTool = signal<ActiveTool | null>(null);
    private readonly _previousActiveTool = signal<ActiveTool | null>(null);
    private readonly _hoveredTiles = signal<Vector2[] | null>(null);
    private readonly _objectGrabOffset = signal<Vector2>({ x: 0, y: 0 });
    private readonly _objectDropVec2 = signal<Vector2>({ x: 0, y: 0 });

    get activeTool(): ActiveTool | null {
        return this._activeTool();
    }

    set activeTool(tool: ActiveTool) {
        this._previousActiveTool.set(this._activeTool());
        this._activeTool.set(tool);
    }

    get objectGrabOffset(): Vector2 {
        return this._objectGrabOffset();
    }

    set objectGrabOffset(offset: Vector2) {
        this._objectGrabOffset.set(offset);
    }

    get objectDropVec2(): Vector2 {
        return this._objectDropVec2();
    }

    set objectDropVec2(vec: Vector2) {
        this._objectDropVec2.set(vec);
    }

    get hoveredTiles() {
        return this._hoveredTiles.asReadonly();
    }

    setupObjectDrag(object: GameEditorPlaceableDto, evt: DragEvent): void {
        if (!evt.dataTransfer) return;
        evt.dataTransfer.effectAllowed = 'move';
        evt.dataTransfer.setData(PlaceableMime[object.kind], object.id || object.kind);
        const footprint = this.getFootprintOf(PlaceableKind[object.kind]);
        if (!Number.isFinite(footprint) || footprint <= 0) return;
        this.objectGrabOffset = {
            x: evt.offsetX,
            y: evt.offsetY,
        };
        this.activeTool = {
            type: ToolType.PlaceableTool,
            placeableKind: PlaceableKind[object.kind],
        };
    }

    revertToPreviousTool(): void {
        this._activeTool.set(this._previousActiveTool());
        this._previousActiveTool.set(null);
        this._hoveredTiles.set(null);
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
        const object = this.store.getPlacedObjectAt(x, y);
        if (
            object &&
            ((object.kind === PlaceableKind.BOAT && tool.tileKind !== TileKind.WATER) ||
                tool.tileKind === TileKind.WALL ||
                tool.tileKind === TileKind.DOOR)
        ) {
            this.store.removeObject(object.id);
        }
    }

    resolveHoveredTiles(evt: DragEvent, tileX: number, tileY: number) {
        const tool = this.activeTool;
        if (!tool || tool.type !== ToolType.PlaceableTool) return;

        const footprint = PlaceableFootprint[tool.placeableKind];
        if (!Number.isFinite(footprint) || footprint <= 0) return;
        const hoveredTiles: Vector2[] = [];

        const offsetX = evt.offsetX;
        const offsetY = evt.offsetY;

        const { x: closestX, y: closestY } = this.processDropTile(tileX, tileY, offsetX, offsetY);

        this.objectDropVec2 = { x: closestX, y: closestY };

        for (let dy = 0; dy < footprint; dy++) {
            for (let dx = 0; dx < footprint; dx++) {
                hoveredTiles.push({ x: closestX + dx, y: closestY + dy });
            }
        }

        this._hoveredTiles.set(hoveredTiles);
        return hoveredTiles;
    }

    resolveDropAction(evt: DragEvent): void {
        this._hoveredTiles.set(null);
        if (evt && evt.dataTransfer) {
            const mime = Object.values(PlaceableMime).find((m) => evt.dataTransfer?.types.includes(m));
            if (!mime) return;
            const data = evt.dataTransfer.getData(mime);
            if (!data) return;
            if (Object.values(PlaceableKind).includes(data as PlaceableKind)) {
                const { x: closestX, y: closestY } = this.objectDropVec2;
                this.tryPlaceObject(closestX, closestY, data as PlaceableKind);
            } else {
                const { x: closestX, y: closestY } = this.objectDropVec2;
                this.tryMoveObject(closestX, closestY, data);
            }
        }
    }

    removeObject(id: string): void {
        const tool = this.activeTool;
        if (!tool || tool.type !== ToolType.PlaceableEraserTool) return;
        this.store.removeObject(id);
        this.revertToPreviousTool();
    }

    getFootprintOf(kind: PlaceableKind): number {
        return PlaceableFootprint[kind];
    }

    hasMime(evt: DragEvent): boolean {
        const types = Array.from(evt.dataTransfer?.types ?? []);
        return Object.values(PlaceableMime).some((mime) => types.includes(mime));
    }

    private canPlaceObject(x: number, y: number, kind: PlaceableKind, excludeId?: string): boolean {
        const footprint = PlaceableFootprint[kind] ?? 1;

        for (let dy = 0; dy < footprint; dy++) {
            for (let dx = 0; dx < footprint; dx++) {
                const tx = x + dx;
                const ty = y + dy;

                const tile = this.store.getTileAt(tx, ty);
                if (!tile) return false;

                const tk = tile.kind as TileKind;

                if (tk === TileKind.WALL || tk === TileKind.DOOR) return false;

                if (kind === PlaceableKind.BOAT) {
                    if (tk !== TileKind.WATER) return false;
                }

                const object = this.store.getPlacedObjectAt(tx, ty);
                if (object && object.id !== excludeId) return false;
            }
        }

        return true;
    }

    private tryPlaceObject(x: number, y: number, kind: PlaceableKind): void {
        if (!this.canPlaceObject(x, y, kind)) return;
        this.store.placeObject(kind, x, y);
    }

    private tryMoveObject(x: number, y: number, id: string): void {
        const obj = this.store.placedObjects.find((o) => o.id === id);
        if (!obj) return;

        const kind = PlaceableKind[obj.kind];
        if (!this.canPlaceObject(x, y, kind, id)) return;
        this.store.moveObject(id, x, y);
    }

    private processDropTile(tileX: number, tileY: number, offsetX: number, offsetY: number): Vector2 {
        const tool = this.activeTool;
        if (!tool || tool.type !== ToolType.PlaceableTool) return { x: tileX, y: tileY };

        const footprint = PlaceableFootprint[tool.placeableKind];
        if (!Number.isFinite(footprint) || footprint <= 0) return { x: tileX, y: tileY };

        const tileSize = this.store.tileSizePx;

        const pointerPxX = tileX * tileSize + offsetX;
        const pointerPxY = tileY * tileSize + offsetY;
        const grab = this.objectGrabOffset;
        const objectGrabIsFromCenter = false;

        const halfSizePx = (footprint * tileSize) / 2;
        const topLeftPxX = pointerPxX - grab.x - (objectGrabIsFromCenter ? halfSizePx : 0);
        const topLeftPxY = pointerPxY - grab.y - (objectGrabIsFromCenter ? halfSizePx : 0);

        const snappedTopLeftTileX = Math.round(topLeftPxX / tileSize);
        const snappedTopLeftTileY = Math.round(topLeftPxY / tileSize);

        return { x: snappedTopLeftTileX, y: snappedTopLeftTileY };
    }
}
