// editor-placed-object.component.ts
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEditorPlaceableDto } from '@app/dto/gameEditorPlaceableDto';
import { PlaceableKind, PlaceableMime } from '@common/enums/placeable-kind.enum';
import { GameEditorInteractionsService, ToolType } from '@app/services/game-editor-interactions/game-editor-interactions.service';

@Component({
    selector: 'app-editor-placed-object',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './object.component.html',
    styleUrls: ['./object.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameEditorObjectComponent {
    @Input({ required: true }) object!: GameEditorPlaceableDto;
    @Input() tileSize = 48;

    constructor(private readonly interactions: GameEditorInteractionsService) {}

    isDragging = false;

    @HostBinding('style.grid-column')
    get gridCol() {
        const w = this.interactions.getFootprintOf(PlaceableKind[this.object.kind]);
        return `${this.object.x + 1} / span ${w}`;
    }

    @HostBinding('style.grid-row')
    get gridRow() {
        const h = this.interactions.getFootprintOf(PlaceableKind[this.object.kind]);
        return `${this.object.y + 1} / span ${h}`;
    }

    @HostBinding('style.--tile-px')
    get tileVar() {
        return this.tileSize;
    }

    onDragStart(evt: DragEvent) {
        if (!evt.dataTransfer) return;
        evt.dataTransfer.effectAllowed = 'copy';
        evt.dataTransfer.setData(PlaceableMime[this.object.kind], this.object.id);
        this.isDragging = true;
        this.interactions.setActiveTool({
            type: ToolType.PlaceableTool,
            placeableKind: PlaceableKind[this.object.kind],
        });
    }

    onDragEnd() {
        this.isDragging = false;
        this.interactions.revertToPreviousTool();
    }

    onContextMenu(evt: MouseEvent) {
        evt.preventDefault();
    }

    onMouseDown(evt: MouseEvent) {
        evt.stopPropagation();
        if (evt.button === 2) {
            this.interactions.setActiveTool({
                type: ToolType.PlaceableEraserTool,
            });
        }
    }

    onMouseUp(evt: MouseEvent) {
        evt.stopPropagation();
        if (evt.button === 2) {
            this.interactions.removeObject(this.object.id);
        }
    }
}
