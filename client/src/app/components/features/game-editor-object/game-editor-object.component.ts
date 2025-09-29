import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEditorPlaceableDto } from '@app/dto/gameEditorPlaceableDto';
import { PlaceableKind, PlaceableLabel } from '@common/enums/placeable-kind.enum';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { ToolType } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';

@Component({
    selector: 'app-editor-placed-object',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-editor-object.component.html',
    styleUrls: ['./game-editor-object.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameEditorObjectComponent {
    @Input({ required: true }) object: GameEditorPlaceableDto;
    @Input({ required: true }) tileSize: number;

    constructor(
        private readonly gameEditorInteractionsService: GameEditorInteractionsService,
        private readonly assetsService: AssetsService,
    ) {}

    isDragging = false;

    get image() {
        return this.assetsService.getPlaceableImage(PlaceableKind[this.object.kind]);
    }

    get label() {
        return PlaceableLabel[this.object.kind];
    }

    @HostBinding('style.grid-column')
    get gridCol() {
        const w = this.gameEditorInteractionsService.getFootprintOf(PlaceableKind[this.object.kind]);
        return `${this.object.x + 1} / span ${w}`;
    }

    @HostBinding('style.grid-row')
    get gridRow() {
        const h = this.gameEditorInteractionsService.getFootprintOf(PlaceableKind[this.object.kind]);
        return `${this.object.y + 1} / span ${h}`;
    }

    @HostBinding('style.--tile-px')
    get tileVar() {
        return this.tileSize;
    }

    onDragStart(evt: DragEvent) {
        if (!evt.dataTransfer) return;
        this.gameEditorInteractionsService.setupObjectDrag(this.object, evt);
        this.isDragging = true;
    }

    onDragEnd() {
        this.isDragging = false;
        this.gameEditorInteractionsService.revertToPreviousTool();
    }

    onContextMenu(evt: MouseEvent) {
        evt.preventDefault();
    }

    onMouseDown(evt: MouseEvent) {
        evt.stopPropagation();
        if (evt.button === 2) {
            this.gameEditorInteractionsService.activeTool = {
                type: ToolType.PlaceableEraserTool,
            };
        }
    }

    onMouseUp(evt: MouseEvent) {
        evt.stopPropagation();
        if (evt.button === 2) {
            this.gameEditorInteractionsService.removeObject(this.object.id);
        }
    }

    onDrop(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
    }
}
