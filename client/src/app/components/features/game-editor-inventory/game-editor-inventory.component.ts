import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { ToolType } from '@app/interfaces/game-editor.interface';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { PlaceableFootprint, PlaceableKind, PlaceableLabel, PlaceableMime } from '@common/enums/placeable-kind.enum';

@Component({
    selector: 'app-editor-inventory',
    standalone: true,
    templateUrl: './game-editor-inventory.component.html',
    styleUrls: ['./game-editor-inventory.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgStyle],
})
export class GameEditorInventoryComponent {
    readonly placeableLabel = PlaceableLabel;
    readonly dndMime = PlaceableMime;
    readonly placeableFootprint = PlaceableFootprint;
    readonly invKeys = Object.keys(this.gameEditorStoreService.inventory()) as PlaceableKind[];
    dragOver = '';

    constructor(
        private readonly gameEditorStoreService: GameEditorStoreService,
        private readonly gameEditorInteractionsService: GameEditorInteractionsService,
    ) {}

    get inventory() {
        return this.gameEditorStoreService.inventory();
    }

    get tileSizePx(): number {
        return this.gameEditorStoreService.tileSizePx;
    }

    @HostBinding('style.--tile-px')
    get tileVar(): number {
        return this.gameEditorStoreService.tileSizePx;
    }

    onDragStart(evt: DragEvent, kind: PlaceableKind, disabled: boolean): void {
        if (disabled || !evt.dataTransfer) {
            evt.preventDefault();
            return;
        }

        this.gameEditorInteractionsService.setupObjectDrag(
            {
                kind,
                id: '',
                x: 0,
                y: 0,
                placed: false,
                orientation: 'N',
            },
            evt,
        );
    }

    onDragEnd(): void {
        this.gameEditorInteractionsService.revertToPreviousTool();
    }

    onSlotDragOver(evt: DragEvent, kind: PlaceableKind): void {
        evt.preventDefault();
        evt.stopPropagation();
        if (!evt.dataTransfer) return;
        if (!this.slotAccepts(evt, kind)) return;
        evt.dataTransfer.dropEffect = 'move';
    }
    onSlotDragEnter(evt: DragEvent, kind: PlaceableKind): void {
        evt.preventDefault();
        evt.stopPropagation();
        if (!this.slotAccepts(evt, kind)) return;
        this.dragOver = kind;
    }
    onSlotDragLeave(): void {
        this.dragOver = '';
    }

    onSlotDrop(evt: DragEvent, kind: PlaceableKind): void {
        evt.preventDefault();
        evt.stopPropagation();
        if (!evt.dataTransfer) return;
        const id = evt.dataTransfer.getData(this.dndMime[kind]);
        if (!id) return;
        this.gameEditorInteractionsService.activeTool = {
            type: ToolType.PlaceableEraserTool,
        };
        this.gameEditorInteractionsService.removeObject(id);
        this.dragOver = '';
    }

    private slotAccepts(evt: DragEvent, kind: PlaceableKind): boolean {
        const types = Array.from(evt.dataTransfer?.types ?? []);
        return types.includes(this.dndMime[kind]);
    }
}
