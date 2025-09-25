import { Component, ElementRef, Input, NgZone } from '@angular/core';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { TileKind } from '@common/enums/tile-kind.enum';
import { TileSizeProbeDirective } from '@app/pages/game-editor-page/directives/tile-size-probe.directive';
import { NgStyle } from '@angular/common';
import { GameEditorTileDto } from '@app/api/model/gameEditorTileDto';
import { GameEditorInteractionsService, ToolType } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { TileSprite as TileImage } from '@common/enums/tile-sprite.enum';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';

@Component({
    selector: 'app-editor-tile',
    templateUrl: './game-editor-tile.component.html',
    styleUrls: ['./game-editor-tile.component.scss'],
    standalone: true,
    imports: [NgStyle],
})
export class GameEditorTileComponent extends TileSizeProbeDirective {
    constructor(
        readonly gameEditorStoreService: GameEditorStoreService,
        readonly gameEditorInteractionsService: GameEditorInteractionsService,
        readonly gameEditorCheckService: GameEditorCheckService,
        el: ElementRef<HTMLElement>,
        zone: NgZone,
    ) {
        super(el, zone);
    }

    @Input({ required: true }) tile: GameEditorTileDto;

    hasProblem(): boolean {
        return (
            this.gameEditorCheckService.editorProblems().terrainAccessibility.tiles.some((p) => p.x === this.tile.x && p.y === this.tile.y) ||
            this.gameEditorCheckService.editorProblems().doors.tiles.some((p) => p.x === this.tile.x && p.y === this.tile.y)
        );
    }

    isDropHovered(): boolean {
        return this.gameEditorInteractionsService.hoveredTiles()?.some((t) => t.x === this.tile.x && t.y === this.tile.y) ?? false;
    }

    isBrushHovered(): boolean {
        const tool = this.gameEditorInteractionsService.activeTool();
        return tool?.type === ToolType.TileBrushTool;
    }

    onRightClick(event: MouseEvent) {
        event.preventDefault();
    }

    onMouseDown(event: MouseEvent) {
        event.preventDefault();
        if (event.button === 0) {
            this.gameEditorInteractionsService.dragStart(this.tile.x, this.tile.y, 'left');
        } else if (event.button === 2) {
            this.gameEditorInteractionsService.setActiveTool({ type: ToolType.TileBrushTool, tileKind: TileKind.BASE, leftDrag: false, rightDrag: false });
            this.gameEditorInteractionsService.dragStart(this.tile.x, this.tile.y, 'right');
        }
    }

    onMouseUp(event: MouseEvent) {
        event.preventDefault();
        this.gameEditorInteractionsService.dragEnd();
        if (event.button === 2) {
            this.gameEditorInteractionsService.revertToPreviousTool();
        }
    }

    onMouseOver(event: MouseEvent) {
        event.preventDefault();
        this.gameEditorInteractionsService.tilePaint(this.tile.x, this.tile.y);
    }

    colorOf(kind: GameEditorTileDto.KindEnum): string {
        switch (kind) {
            case TileKind.BASE:
                return '#a3e635';
            case TileKind.WALL:
                return '#374151';
            case TileKind.DOOR:
                return '#fbbf24';
            case TileKind.WATER:
                return '#60a5fa';
            case TileKind.ICE:
                return '#93c5fd';
            case TileKind.TELEPORT:
                return '#f472b6';
            default:
                return '#ffffff';
        }
    }

    onTileDragOver(evt: DragEvent) {
        if (!this.gameEditorInteractionsService.hasMime(evt)) return;
        if (!evt.dataTransfer) return;
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
        this.gameEditorInteractionsService.resolveHoveredTiles(evt, this.tile.x, this.tile.y);
    }

    onTileDragEnter(evt: DragEvent) {
        if (!this.gameEditorInteractionsService.hasMime(evt)) return;
    }

    imageOf(kind: GameEditorTileDto.KindEnum): string {
        return TileImage[kind];
    }

    onTileDrop(evt: DragEvent) {
        if (!this.gameEditorInteractionsService.hasMime(evt)) return;
        if (!evt.dataTransfer) return;
        evt.preventDefault();
        evt.stopPropagation();

        const x = this.tile.x;
        const y = this.tile.y;

        this.gameEditorInteractionsService.resolveDropAction(evt, x, y);
    }
}
