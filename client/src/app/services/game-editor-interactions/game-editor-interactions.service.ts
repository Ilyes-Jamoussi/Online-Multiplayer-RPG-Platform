import { Injectable, signal } from '@angular/core';
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

    get activeTool() {
        return this._activeTool.asReadonly();
    }

    get hoveredTiles() {
        return this._hoveredTiles.asReadonly();
    }

    setActiveTool(tool: ActiveTool): void {
        this._previousActiveTool.set(this._activeTool());
        this._activeTool.set(tool);
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
        const tool = this.activeTool?.();
        if (!tool || tool.type !== ToolType.PlaceableTool) return;

        const footprint = PlaceableFootprint[tool.placeableKind];
        if (!Number.isFinite(footprint) || footprint <= 0) return;
        const hoveredTiles: Vector2[] = [];

        if (footprint === 1) {
            hoveredTiles.push({ x: tileX, y: tileY });
        } else {
            const offsetX = evt.offsetX;
            const offsetY = evt.offsetY;

            const { x: closestX, y: closestY } = this.getClosestTile(tileX, tileY, offsetX, offsetY);

            for (let dy = 0; dy < footprint; dy++) {
                for (let dx = 0; dx < footprint; dx++) {
                    hoveredTiles.push({ x: closestX + dx, y: closestY + dy });
                }
            }
        }
        this._hoveredTiles.set(hoveredTiles);
        return hoveredTiles;
    }

    resolveDropAction(evt: DragEvent, x: number, y: number): void {
        this._hoveredTiles.set(null);
        if (evt && evt.dataTransfer) {
            const mime = Object.values(PlaceableMime).find((m) => evt.dataTransfer?.types.includes(m));
            if (!mime) return;
            const data = evt.dataTransfer.getData(mime);
            if (!data) return;
            if (Object.values(PlaceableKind).includes(data as PlaceableKind)) {
                const { x: closestX, y: closestY } = this.getClosestTile(x, y, evt.offsetX, evt.offsetY);
                this.tryPlaceObject(closestX, closestY, data as PlaceableKind);
            } else {
                const { x: closestX, y: closestY } = this.getClosestTile(x, y, evt.offsetX, evt.offsetY);
                this.tryMoveObject(closestX, closestY, data);
            }
        }
    }

    removeObject(id: string): void {
        const tool = this.activeTool?.();
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

    private getClosestTile(tileX: number, tileY: number, offsetX: number, offsetY: number): Vector2 {
        const tool = this.activeTool?.();
        if (!tool || tool.type !== ToolType.PlaceableTool) return { x: tileX, y: tileY };
        const footprint = PlaceableFootprint[tool.placeableKind];
        if (!Number.isFinite(footprint) || footprint <= 0 || footprint === 1) {
            return { x: tileX, y: tileY };
        }
        const tileSize = this.store.tileSizePx;
        const closestX = offsetX < tileSize / 2 ? tileX - 1 : tileX;
        const closestY = offsetY < tileSize / 2 ? tileY - 1 : tileY;
        return { x: closestX, y: closestY };
    }
}
