import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { ToolType } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { PlaceableKind, PlaceableLabel } from '@common/enums/placeable-kind.enum';

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

    isDragging = false;

    constructor(
        private readonly gameEditorInteractionsService: GameEditorInteractionsService,
        private readonly assetsService: AssetsService,
    ) {}

    get image(): string {
        return this.assetsService.getPlaceableImage(PlaceableKind[this.object.kind]);
    }

    get tooltip(): string {
        return PlaceableLabel[this.object.kind];
    }

    @HostBinding('style.grid-column')
    get gridCol(): string {
        const w = this.gameEditorInteractionsService.getFootprintOf(PlaceableKind[this.object.kind]);
        return `${this.object.x + 1} / span ${w}`;
    }

    @HostBinding('style.grid-row')
    get gridRow(): string {
        const h = this.gameEditorInteractionsService.getFootprintOf(PlaceableKind[this.object.kind]);
        return `${this.object.y + 1} / span ${h}`;
    }

    @HostBinding('style.--tile-px')
    get tileVar(): number {
        return this.tileSize;
    }

    onDragStart(evt: DragEvent): void {
        if (!evt.dataTransfer) return;
        this.gameEditorInteractionsService.setupObjectDrag(this.object, evt);
        this.isDragging = true;
    }

    onDragEnd(): void {
        this.isDragging = false;
        this.gameEditorInteractionsService.revertToPreviousTool();
    }

    onContextMenu(evt: MouseEvent): void {
        evt.preventDefault();
    }

    onMouseDown(evt: MouseEvent): void {
        evt.stopPropagation();
        if (evt.button === 2) {
            this.gameEditorInteractionsService.activeTool = {
                type: ToolType.PlaceableEraserTool,
            };
        }
    }

    onMouseUp(evt: MouseEvent): void {
        evt.stopPropagation();
        if (evt.button === 2) {
            this.gameEditorInteractionsService.removeObject(this.object.id);
        }
    }

    onDrop(evt: DragEvent): void {
        evt.preventDefault();
        evt.stopPropagation();
    }
}
