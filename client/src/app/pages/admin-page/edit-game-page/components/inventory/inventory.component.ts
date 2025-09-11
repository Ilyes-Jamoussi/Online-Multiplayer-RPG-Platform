// inventory component that displayed placeable items and their remaining counts (received as INPUTS this component doesnt manage state)
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActiveTool, InventoryState, PlaceableKind } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

@Component({
    selector: 'app-editor-inventory',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
})
export class EditorInventoryComponent {
    @Input({
        required: true,
    })
    inventory: InventoryState = {
        available: {
            [PlaceableKind.FIGHT]: 0,
            [PlaceableKind.HEAL]: 0,
            [PlaceableKind.BOAT]: 0,
            [PlaceableKind.FLAG]: 0,
            [PlaceableKind.START]: 0,
        },
    };

    @Output()
    selectItem = new EventEmitter<ActiveTool>();

    readonly placeableKind = PlaceableKind;

    isItemAvailable(kind: PlaceableKind): boolean {
        return (this.inventory?.available?.[kind] ?? 0) > 0;
    }

    onSelect(kind: PlaceableKind) {
        const tool: ActiveTool = { type: 'OBJECT', kind };
        this.selectItem.emit(tool);
    }
}
