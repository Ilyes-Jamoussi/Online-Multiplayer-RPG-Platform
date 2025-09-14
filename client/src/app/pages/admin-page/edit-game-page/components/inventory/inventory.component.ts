import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';

import { GameDraftService } from '@app/pages/admin-page/edit-game-page/services/game-draft.service';
import { EditorToolsService } from '@app/pages/admin-page/edit-game-page/services/editor-tools.service';
import { PlaceableKind, DND_MIME } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

import { DraggablePanelComponent } from '@app/shared/ui/components/draggable-panel/draggable-panel.component'; // <-- path where you placed it

@Component({
    selector: 'app-editor-inventory',
    standalone: true,
    imports: [CommonModule, AsyncPipe, DraggablePanelComponent],
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorInventoryComponent implements AfterViewInit {
    private readonly draft = inject(GameDraftService);
    private readonly tools = inject(EditorToolsService);

    availableItems$ = this.draft.inventoryCounts$;
    placeableKind = PlaceableKind;

    ngAfterViewInit() {
        // no-op; kept if you later want to react after first render
    }

    /** Select an object type if it is available */
    select(kind: PlaceableKind, disabled: boolean) {
        if (disabled) return;
        this.tools.setActiveTool({ type: 'OBJECT', kind });
    }

    /** Begin a native DnD for placing objects on the canvas */
    onDragStart(evt: DragEvent, kind: PlaceableKind, disabled: boolean) {
        if (disabled || !evt.dataTransfer) return;
        evt.dataTransfer.effectAllowed = 'copy';
        evt.dataTransfer.setData(DND_MIME, kind);
        this.tools.setActiveTool({ type: 'OBJECT', kind });
    }
}
