import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { GameEditorInteractionsService, ToolType } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { PlaceableKind, PlaceableMime } from '@common/enums/placeable-kind.enum';

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
    dragOver = '';

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
        evt.dataTransfer.effectAllowed = 'copy';
        evt.dataTransfer.setData(this.dndMime[kind], kind);

        const img = document.createElement('div');
        img.style.fontSize = `${this.gameEditorStoreService.tileSizePx}px`;
        img.style.lineHeight = '1';
        img.style.width = `${this.gameEditorStoreService.tileSizePx}px`;
        img.style.height = `${this.gameEditorStoreService.tileSizePx}px`;
        img.style.display = 'flex';
        img.style.alignItems = 'center';
        img.style.justifyContent = 'center';
        img.style.pointerEvents = 'none';
        img.style.position = 'absolute';
        img.style.top = '-1000px';

        img.textContent = this.iconOf(kind);
        document.body.appendChild(img);
        evt.dataTransfer.setDragImage(img, this.gameEditorStoreService.tileSizePx / 2, this.gameEditorStoreService.tileSizePx / 2);
        setTimeout(() => document.body.removeChild(img), 0);

        this.gameEditorInteractionsService.setActiveTool({
            type: ToolType.PlaceableTool,
            placeableKind: kind,
        });
    }

    onDragEnd() {
        this.gameEditorInteractionsService.revertToPreviousTool();
    }

    onSlotDragOver(evt: DragEvent, kind: PlaceableKind) {
        if (!evt.dataTransfer) return;
        if (!this.slotAccepts(evt, kind)) return;
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
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
        this.gameEditorInteractionsService.setActiveTool({
            type: ToolType.PlaceableEraserTool,
        });
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
