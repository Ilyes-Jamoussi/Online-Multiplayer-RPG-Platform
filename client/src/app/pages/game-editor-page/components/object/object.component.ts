// editor-placed-object.component.ts
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEditorPlaceableDto } from '@app/api/model/gameEditorPlaceableDto';
import { PlaceableKind, PlaceableMime } from '@common/enums/placeable-kind.enum';

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
    /** taille tuile pour cohérence visuelle (emoji/sprite) */
    @Input() tileSize = 48;

    isDragging = false;

    private footprintOf(kind: PlaceableKind) {
        return kind === PlaceableKind.HEAL || kind === PlaceableKind.FIGHT ? { w: 2, h: 2 } : { w: 1, h: 1 };
    }

    @HostBinding('style.grid-column')
    get gridCol() {
        const w = this.footprintOf(PlaceableKind[this.object.kind]).w;
        return `${this.object.x + 1} / span ${w}`;
    }

    @HostBinding('style.grid-row')
    get gridRow() {
        const h = this.footprintOf(PlaceableKind[this.object.kind]).h;
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
    }

    onDragEnd() {
        this.isDragging = false;
    }
}
