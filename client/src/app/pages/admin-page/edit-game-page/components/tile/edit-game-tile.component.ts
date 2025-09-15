import { ChangeDetectionStrategy, Component, inject, Input, HostBinding, HostListener } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TileKind, TileSpec, DND_MIME, PlaceableKind } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';
import { TileService } from '@app/services/game/game-editor/tile.service';
import { EditorToolsService } from '@app/services/game/game-editor/editor-tools.service';
import { TileSizeProbeDirective } from '@app/pages/admin-page/edit-game-page/directives/tile-size-probe.directive';
import { ObjectService } from '@app/services/game/game-editor/object.service';

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

    private readonly tiles = inject(TileService);
    private readonly tools = inject(EditorToolsService);
    private readonly objects = inject(ObjectService);

    onRightClick(event: MouseEvent) {
        event.preventDefault();
    }

    onMouseDown(event: MouseEvent) {
        event.preventDefault();
        if (event.button === 0) {
            this.tiles.applyPaint(this.x, this.y);
            this.tools.toggleDragging('left');
        } else if (event.button === 2) {
            this.tiles.applyRightClick(this.x, this.y);
            this.tools.toggleDragging('right');
        }
    }

    onMouseUp(event: MouseEvent) {
        event.preventDefault();
        if (event.button === 0) {
            this.tools.toggleDragging('left');
        } else if (event.button === 2) {
            this.tools.toggleDragging('right');
        }
    }

    onMouseOver(event: MouseEvent) {
        event.preventDefault();
        this.tiles.dragPaint(this.x, this.y);
    }

    colorOf(kind: TileKind): string {
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
        this.objects.tryPlaceObject(this.x, this.y, kindStr as PlaceableKind);
        this.tools.setActiveTool({ type: 'TILE_BRUSH', tile: { kind: TileKind.BASE } });
    }
}
