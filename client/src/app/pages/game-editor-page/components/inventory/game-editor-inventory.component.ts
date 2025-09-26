import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { GameEditorInteractionsService, ToolType } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { PlaceableFootprint, PlaceableKind, PlaceableMime } from '@common/enums/placeable-kind.enum';

@Component({
    selector: 'app-editor-inventory',
    standalone: true,
    templateUrl: './game-editor-inventory.component.html',
    styleUrls: ['./game-editor-inventory.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameEditorInventoryComponent {
    readonly dndMime = PlaceableMime;
    readonly placeableFootprint = PlaceableFootprint;
    dragOver = '';

    constructor(
        readonly store: GameEditorStoreService,
        private readonly interactions: GameEditorInteractionsService,
    ) {}

    @HostBinding('style.--tile-px')
    get tileVar() {
        return this.store.tileSizePx;
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

        this.interactions.setupObjectDrag(
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
        this.interactions.revertToPreviousTool();
    }

    onSlotDragOver(evt: DragEvent, kind: PlaceableKind) {
        if (!evt.dataTransfer) return;
        if (!this.slotAccepts(evt, kind)) return;
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'move';
    }
    onSlotDragEnter(evt: DragEvent, kind: PlaceableKind) {
        if (!this.slotAccepts(evt, kind)) return;
        this.dragOver = kind;
    }
    onSlotDragLeave() {
        this.dragOver = '';
    }

    onSlotDrop(evt: DragEvent, kind: PlaceableKind) {
        if (!evt.dataTransfer) return;
        const id = evt.dataTransfer.getData(this.dndMime[kind]);
        if (!id) return;
        evt.preventDefault();
        evt.stopPropagation();
        this.interactions.activeTool = {
            type: ToolType.PlaceableEraserTool,
        };
        this.interactions.removeObject(id);
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
