import { ChangeDetectionStrategy, Component, Input, HostBinding, HostListener, ElementRef, NgZone } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TileSpec, DND_MIME } from '@app/interfaces/game/game-editor.interface';
import { TileService } from '@app/services/game/game-editor/tile.service';
import { EditorToolsService } from '@app/services/game/game-editor/editor-tools.service';
import { TileSizeProbeDirective } from '@app/pages/game-editor-page/directives/tile-size-probe.directive';
import { ObjectService } from '@app/services/game/game-editor/object.service';
import { TileKind } from '@common/enums/tile-kind.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { ReadTileDto } from '@app/api/model/readTileDto';

@Component({
    selector: 'app-edit-game-tile',
    standalone: true,
    imports: [NgStyle],
    templateUrl: './edit-game-tile.component.html',
    styleUrls: ['./edit-game-tile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditGameTileComponent extends TileSizeProbeDirective {
    @Input({ required: true }) tile!: TileSpec;
    @Input({ required: true }) x!: number;
    @Input({ required: true }) y!: number;

    constructor(
        private readonly tileService: TileService,
        private readonly editorToolsService: EditorToolsService,
        private readonly objectService: ObjectService,
        el: ElementRef<HTMLElement>,
        zone: NgZone,
    ) {
        super(el, zone);
    }

    onRightClick(event: MouseEvent) {
        event.preventDefault();
    }

    onMouseDown(event: MouseEvent) {
        event.preventDefault();
        if (event.button === 0) {
            this.tileService.applyPaint(this.x, this.y);
            this.editorToolsService.toggleDragging('left');
        } else if (event.button === 2) {
            this.tileService.applyRightClick(this.x, this.y);
            this.editorToolsService.toggleDragging('right');
        }
    }

    onMouseUp(event: MouseEvent) {
        event.preventDefault();
        if (event.button === 0) {
            this.editorToolsService.toggleDragging('left');
        } else if (event.button === 2) {
            this.editorToolsService.toggleDragging('right');
        }
    }

    onMouseOver(event: MouseEvent) {
        event.preventDefault();
        this.tileService.dragPaint(this.x, this.y);
    }

    colorOf(kind: ReadTileDto.KindEnum): string {
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

    @HostBinding('class.drop-hover')
    dropHover = false;

    @HostListener('dragover', ['$event'])
    onDragOver(evt: DragEvent) {
        if (!evt.dataTransfer) return;
        if (evt.dataTransfer.types.includes(DND_MIME)) {
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        }
    }

    @HostListener('dragenter', ['$event'])
    onDragEnter(evt: DragEvent) {
        if (evt.dataTransfer?.types.includes(DND_MIME)) this.dropHover = true;
    }

    @HostListener('dragleave')
    onDragLeave() {
        this.dropHover = false;
    }

    @HostListener('drop', ['$event'])
    onDrop(evt: DragEvent) {
        this.dropHover = false;
        if (!evt.dataTransfer) return;
        const kindStr = evt.dataTransfer.getData(DND_MIME);
        if (!kindStr) return;
        evt.preventDefault();
        this.objectService.tryPlaceObject(this.x, this.y, kindStr as PlaceableKind);
        this.editorToolsService.setActiveTool({ type: 'TILE_BRUSH', tile: TileKind.BASE });
    }
}
