import { Component, ElementRef, Input, NgZone } from '@angular/core';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { TileKind } from '@common/enums/tile-kind.enum';
import { TileSizeProbeDirective } from '@app/pages/game-editor-page/directives/tile-size-probe.directive';
import { NgStyle } from '@angular/common';
import { GameEditorTileDto } from '@app/dto/gameEditorTileDto';
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
        readonly store: GameEditorStoreService,
        readonly interactions: GameEditorInteractionsService,
        readonly editorCheck: GameEditorCheckService,
        el: ElementRef<HTMLElement>,
        zone: NgZone,
    ) {
        super(el, zone);
    }

    @Input({ required: true }) tile: GameEditorTileDto;

    hasProblem(): boolean {
        return (
            this.editorCheck.editorProblems().terrainAccessibility.tiles.some((p) => p.x === this.tile.x && p.y === this.tile.y) ||
            this.editorCheck.editorProblems().doors.tiles.some((p) => p.x === this.tile.x && p.y === this.tile.y)
        );
    }

    isDropHovered(): boolean {
        return this.interactions.hoveredTiles()?.some((t) => t.x === this.tile.x && t.y === this.tile.y) ?? false;
    }

    isBrushHovered(): boolean {
        const tool = this.interactions.activeTool;
        return tool?.type === ToolType.TileBrushTool;
    }

    onRightClick(event: MouseEvent) {
        event.preventDefault();
    }

    onMouseDown(event: MouseEvent) {
        event.preventDefault();
        if (event.button === 0) {
            this.interactions.dragStart(this.tile.x, this.tile.y, 'left');
        } else if (event.button === 2) {
            this.interactions.activeTool = { type: ToolType.TileBrushTool, tileKind: TileKind.BASE, leftDrag: false, rightDrag: false };
            this.interactions.dragStart(this.tile.x, this.tile.y, 'right');
        }
    }

    onMouseUp(event: MouseEvent) {
        event.preventDefault();
        this.interactions.dragEnd();
        if (event.button === 2) {
            this.interactions.revertToPreviousTool();
        }
    }

    onMouseOver(event: MouseEvent) {
        event.preventDefault();
        this.interactions.tilePaint(this.tile.x, this.tile.y);
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
        if (!this.interactions.hasMime(evt)) return;
        if (!evt.dataTransfer) return;
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'move';
        this.interactions.resolveHoveredTiles(evt, this.tile.x, this.tile.y);
    }

    onTileDragEnter(evt: DragEvent) {
        if (!this.interactions.hasMime(evt)) return;
    }

    imageOf(kind: GameEditorTileDto.KindEnum): string {
        return TileImage[kind];
    }

    onTileDrop(evt: DragEvent) {
        if (!this.interactions.hasMime(evt)) return;
        if (!evt.dataTransfer) return;
        evt.preventDefault();
        evt.stopPropagation();

        this.interactions.resolveDropAction(evt);
    }
}
