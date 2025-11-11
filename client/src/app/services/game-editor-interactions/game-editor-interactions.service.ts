import { Injectable, signal } from '@angular/core';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { PlaceableMime } from '@app/enums/placeable-mime.enum';
import { ActiveTool, ToolType, ToolbarItem, Vector2 } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';

@Injectable()
export class GameEditorInteractionsService {
    constructor(
        private readonly store: GameEditorStoreService,
        private readonly assetService: AssetsService,
    ) {}

    private readonly _activeTool = signal<ActiveTool | null>(null);
    private readonly _previousActiveTool = signal<ActiveTool | null>(null);
    private readonly _hoveredTiles = signal<Vector2[]>([]);
    private readonly _objectGrabOffset = signal<Vector2>({ x: 0, y: 0 });
    private readonly _objectDropVec2 = signal<Vector2>({ x: 0, y: 0 });
    private readonly _draggedObject = signal<PlaceableKind | string>('');

    private get objectGrabOffset(): Vector2 {
        return this._objectGrabOffset();
    }

    private set objectGrabOffset(offset: Vector2) {
        this._objectGrabOffset.set(offset);
    }

    private get objectDropVec2(): Vector2 {
        return this._objectDropVec2();
    }

    private set objectDropVec2(vec: Vector2) {
        this._objectDropVec2.set(vec);
    }

    get activeTool(): ActiveTool | null {
        return this._activeTool();
    }

    set activeTool(tool: ActiveTool) {
        this._previousActiveTool.set(this._activeTool());
        this._activeTool.set(tool);
    }

    get hoveredTiles() {
        return this._hoveredTiles.asReadonly();
    }

    getToolbarBrushes(): ToolbarItem[] {
        return Object.values(TileKind)
            .filter((tileKind) => tileKind !== TileKind.BASE)
            .map((tileKind) => ({
                image: this.assetService.getTileImage(tileKind),
                tileKind,
                class: tileKind.toLowerCase(),
            }));
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
        this._draggedObject.set(object.id || object.kind);
        this.activeTool = {
            type: ToolType.PlaceableTool,
            placeableKind: PlaceableKind[object.kind],
        };
    }

    revertToPreviousTool(): void {
        this._activeTool.set(this._previousActiveTool());
        this._previousActiveTool.set(null);
        this._hoveredTiles.set([]);
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
                tool.tileKind === TileKind.DOOR ||
                tool.tileKind === TileKind.TELEPORT)
        ) {
            this.store.removeObject(object.id);
        }
    }

    resolveHoveredTiles(evt: DragEvent, tileX: number, tileY: number) {
        const tool = this.activeTool;
        if (!tool || tool.type !== ToolType.PlaceableTool) return;

        const footprint = PlaceableFootprint[tool.placeableKind];
        const hoveredTiles: Vector2[] = [];

        const offsetX = evt.offsetX;
        const offsetY = evt.offsetY;

        const { x: closestX, y: closestY } = this.processDropTile(tileX, tileY, offsetX, offsetY);

        this.objectDropVec2 = { x: closestX, y: closestY };

        for (let deltaY = 0; deltaY < footprint; deltaY++) {
            for (let deltaX = 0; deltaX < footprint; deltaX++) {
                hoveredTiles.push({ x: closestX + deltaX, y: closestY + deltaY });
            }
        }

        this._hoveredTiles.set(hoveredTiles);
        return;
    }

    resolveDropAction(evt: DragEvent): void {
        this._hoveredTiles.set([]);
        if (evt.dataTransfer) {
            const mime = Object.values(PlaceableMime).find((mimeType) => evt.dataTransfer?.types.includes(mimeType));
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

    removeObject(id?: string): void {
        const tool = this.activeTool;
        if (!tool || tool.type !== ToolType.PlaceableEraserTool) return;
        this.store.removeObject(id || this._draggedObject());
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
        const footprint = PlaceableFootprint[kind];

        for (let deltaY = 0; deltaY < footprint; deltaY++) {
            for (let deltaX = 0; deltaX < footprint; deltaX++) {
                const targetX = x + deltaX;
                const targetY = y + deltaY;

                const tile = this.store.getTileAt(targetX, targetY);
                if (!tile) return false;

                const tileKind = tile.kind;

                if (tileKind === TileKind.WALL || tileKind === TileKind.DOOR || tileKind === TileKind.TELEPORT) return false;

                if (kind === PlaceableKind.BOAT) {
                    if (tileKind !== TileKind.WATER) return false;
                }

                const object = this.store.getPlacedObjectAt(targetX, targetY);
                if (object && object.id !== excludeId) return false;
            }
        }

        return true;
    }

    private tryPlaceObject(x: number, y: number, kind: PlaceableKind): void {
        if (!this.canPlaceObject(x, y, kind)) return;
        this.store.placeObjectFromInventory(kind, x, y);
    }

    private tryMoveObject(x: number, y: number, id: string): void {
        const object = this.store.placedObjects.find((obj) => obj.id === id);
        if (!object) return;

        const kind = PlaceableKind[object.kind];
        if (!this.canPlaceObject(x, y, kind, id)) return;
        this.store.movePlacedObject(id, x, y);
    }

    private processDropTile(tileX: number, tileY: number, offsetX: number, offsetY: number): Vector2 {
        const tileSize = this.store.tileSizePx;

        const pointerPxX = tileX * tileSize + offsetX;
        const pointerPxY = tileY * tileSize + offsetY;
        const grab = this.objectGrabOffset;

        const topLeftPxX = pointerPxX - grab.x;
        const topLeftPxY = pointerPxY - grab.y;

        const snappedTopLeftTileX = Math.round(topLeftPxX / tileSize);
        const snappedTopLeftTileY = Math.round(topLeftPxY / tileSize);

        return { x: snappedTopLeftTileX, y: snappedTopLeftTileY };
    }
}
