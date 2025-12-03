import { NgStyle } from '@angular/common';
import { Component, ElementRef, Input, NgZone } from '@angular/core';
import { TileSizeProbeDirective } from '@app/directives/tile-size/tile-size-probe.directive';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { ToolType } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { TileKind } from '@common/enums/tile.enum';

@Component({
    selector: 'app-editor-tile',
    templateUrl: './game-editor-tile.component.html',
    styleUrls: ['./game-editor-tile.component.scss'],
    standalone: true,
    imports: [NgStyle],
})
export class GameEditorTileComponent extends TileSizeProbeDirective {
    @Input({ required: true }) tile: GameEditorTileDto;

    constructor(
        private readonly gameEditorInteractionsService: GameEditorInteractionsService,
        private readonly gameEditorCheckService: GameEditorCheckService,
        private readonly assetService: AssetsService,
        elementRef: ElementRef<HTMLElement>,
        zone: NgZone,
    ) {
        super(elementRef, zone);
    }

    get tileImage(): string {
        return this.assetService.getTileImage(TileKind[this.tile.kind], this.tile.open);
    }

    get isInvalid(): boolean {
        return (
            this.gameEditorCheckService
                .editorProblems()
                .terrainAccessibility.tiles.some((position) => position.x === this.tile.x && position.y === this.tile.y) ||
            this.gameEditorCheckService.editorProblems().doors.tiles.some((position) => position.x === this.tile.x && position.y === this.tile.y)
        );
    }

    get isDropHovered(): boolean {
        const hoveredTiles = this.gameEditorInteractionsService.hoveredTiles();
        return hoveredTiles?.some((tile) => tile.x === this.tile.x && tile.y === this.tile.y) ?? false;
    }

    get isBrushHovered(): boolean {
        const tool = this.gameEditorInteractionsService.activeTool;
        return tool?.type === ToolType.TileBrushTool;
    }

    get teleportChannelNumber(): number | null {
        if (this.tile.kind === TileKind.TELEPORT && this.tile.teleportChannel) {
            return this.tile.teleportChannel;
        }
        return null;
    }

    get activeTeleportChannelNumber(): number | null {
        const tool = this.gameEditorInteractionsService.activeTool;
        if (tool?.type === ToolType.TeleportTileTool) {
            return tool.channelNumber;
        }
        return null;
    }

    get isTeleportToolActive(): boolean {
        const tool = this.gameEditorInteractionsService.activeTool;
        return tool?.type === ToolType.TeleportTileTool;
    }

    onRightClick(event: MouseEvent): void {
        event.preventDefault();
    }

    onMouseDown(event: MouseEvent): void {
        event.preventDefault();
        if (event.button === 0) {
            this.gameEditorInteractionsService.dragStart(this.tile.x, this.tile.y, 'left');
        } else if (event.button === 2) {
            if (this.tile.kind === TileKind.TELEPORT) {
                this.gameEditorInteractionsService.selectTeleportTileEraserTool();
            } else {
                this.gameEditorInteractionsService.activeTool = {
                    type: ToolType.TileBrushTool,
                    tileKind: TileKind.BASE,
                    leftDrag: false,
                    rightDrag: false,
                };
            }
            this.gameEditorInteractionsService.dragStart(this.tile.x, this.tile.y, 'right');
        }
    }

    onMouseUp(event: MouseEvent): void {
        event.preventDefault();
        this.gameEditorInteractionsService.dragEnd();
        if (event.button === 2 && this.gameEditorInteractionsService.activeTool?.type) {
            this.gameEditorInteractionsService.revertToPreviousTool();
        }
    }

    onMouseOver(event: MouseEvent): void {
        event.preventDefault();
        this.gameEditorInteractionsService.tilePaint(this.tile.x, this.tile.y);
    }

    onTileDragOver(evt: DragEvent): void {
        if (!this.gameEditorInteractionsService.hasMime(evt)) return;
        if (!evt.dataTransfer) return;
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'move';
        this.gameEditorInteractionsService.resolveHoveredTiles(evt, this.tile.x, this.tile.y);
    }

    onTileDragEnter(evt: DragEvent): void {
        if (!this.gameEditorInteractionsService.hasMime(evt)) return;
    }

    onTileDrop(evt: DragEvent): void {
        if (!this.gameEditorInteractionsService.hasMime(evt)) return;
        if (!evt.dataTransfer) return;
        evt.preventDefault();
        evt.stopPropagation();
        this.gameEditorInteractionsService.resolveDropAction(evt);
    }
}
