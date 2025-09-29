import { NgStyle } from '@angular/common';
import { Component, ElementRef, Input, NgZone } from '@angular/core';
import { TileSizeProbeDirective } from '@app/directives/tile-size-probe.directive';
import { GameEditorTileDto } from '@app/dto/gameEditorTileDto';
import { ToolType } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { TileKind } from '@common/enums/tile-kind.enum';

@Component({
    selector: 'app-editor-tile',
    templateUrl: './game-editor-tile.component.html',
    styleUrls: ['./game-editor-tile.component.scss'],
    standalone: true,
    imports: [NgStyle],
})
export class GameEditorTileComponent extends TileSizeProbeDirective {
    constructor(
        private readonly gameEditorInteractionsService: GameEditorInteractionsService,
        private readonly gameEditorCheckService: GameEditorCheckService,
        private readonly assetService: AssetsService,
        el: ElementRef<HTMLElement>,
        zone: NgZone,
    ) {
        super(el, zone);
    }

    @Input({ required: true }) tile: GameEditorTileDto;

    readonly tileKinds = TileKind;

    get image() {
        return this.assetService.getTileImage(TileKind[this.tile.kind], this.tile.open);
    }

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
        const tool = this.gameEditorInteractionsService.activeTool;
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
            this.gameEditorInteractionsService.activeTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.BASE,
                leftDrag: false,
                rightDrag: false,
            };
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

    onTileDragOver(evt: DragEvent) {
        if (!this.gameEditorInteractionsService.hasMime(evt)) return;
        if (!evt.dataTransfer) return;
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'move';
        this.gameEditorInteractionsService.resolveHoveredTiles(evt, this.tile.x, this.tile.y);
    }

    onTileDragEnter(evt: DragEvent) {
        if (!this.gameEditorInteractionsService.hasMime(evt)) return;
    }

    onTileDrop(evt: DragEvent) {
        if (!this.gameEditorInteractionsService.hasMime(evt)) return;
        if (!evt.dataTransfer) return;
        evt.preventDefault();
        evt.stopPropagation();
        this.gameEditorInteractionsService.resolveDropAction(evt);
    }
}
