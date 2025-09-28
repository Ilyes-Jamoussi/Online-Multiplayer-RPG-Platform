import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { PlaceableFootprint, PlaceableKind, PlaceableMime } from '@common/enums/placeable-kind.enum';
import { ToolType } from '@app/interfaces/game-editor.interface';

@Component({
    selector: 'app-editor-inventory',
    standalone: true,
    templateUrl: './game-editor-inventory.component.html',
    styleUrls: ['./game-editor-inventory.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameEditorInventoryComponent {
    constructor(
        readonly gameEditorStoreService: GameEditorStoreService,
        private readonly gameEditorInteractionsService: GameEditorInteractionsService,
    ) {}

    readonly dndMime = PlaceableMime;
    readonly placeableFootprint = PlaceableFootprint;
    readonly invKeys = Object.keys(this.gameEditorStoreService.inventory()) as PlaceableKind[];
    dragOver = '';

    @HostBinding('style.--tile-px')
    get tileVar() {
        return this.gameEditorStoreService.tileSizePx;
    }

    kindLabel(k: PlaceableKind): string {
        switch (k) {
            case 'START':
                return 'Point de départ';
            case 'FLAG':
                return 'Drapeau';
            case 'HEAL':
                return 'Sanctuaire de soin';
            case 'FIGHT':
                return 'Sanctuaire de combat';
            case 'BOAT':
                return 'Bateau';
            default:
                return String(k);
        }
    }

    iconOf(k: PlaceableKind): string {
        switch (k) {
            case 'START':
                return '🏁';
            case 'FLAG':
                return '🚩';
            case 'HEAL':
                return '🏥';
            case 'FIGHT':
                return '⚔️';
            case 'BOAT':
                return '🛶';
            default:
                return '❓';
        }
    }

    onDragStart(evt: DragEvent, kind: PlaceableKind, disabled: boolean): void {
        if (disabled || !evt.dataTransfer) {
            evt?.preventDefault();
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

    onDragEnd() {
        this.gameEditorInteractionsService.revertToPreviousTool();
    }

    onSlotDragOver(evt: DragEvent, kind: PlaceableKind) {
        evt.preventDefault();
        evt.stopPropagation();
        if (!evt.dataTransfer) return;
        if (!this.slotAccepts(evt, kind)) return;
        evt.dataTransfer.dropEffect = 'move';
    }
    onSlotDragEnter(evt: DragEvent, kind: PlaceableKind) {
        evt.preventDefault();
        evt.stopPropagation();
        if (!this.slotAccepts(evt, kind)) return;
        this.dragOver = kind;
    }
    onSlotDragLeave() {
        this.dragOver = '';
    }

    onSlotDrop(evt: DragEvent, kind: PlaceableKind) {
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

    private types(evt: DragEvent): string[] {
        return Array.from(evt.dataTransfer?.types ?? []);
    }
    private slotAccepts(evt: DragEvent, kind: PlaceableKind): boolean {
        const t = this.types(evt);
        return t.includes(this.dndMime[kind]);
    }
}
