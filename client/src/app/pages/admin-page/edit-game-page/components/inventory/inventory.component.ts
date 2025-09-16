import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';

import { GameDraftService } from '@app/services/game/game-editor/game-draft.service';
import { EditorToolsService } from '@app/services/game/game-editor/editor-tools.service';
import {  DND_MIME } from '@app/interfaces/game/game-editor.interface';

import { DraggablePanelComponent } from '@app/shared/ui/components/draggable-panel/draggable-panel.component'; // <-- path where you placed it
import { PlaceableKind } from '@common/enums/placeable-kind.enum';

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
