import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';

@Component({
    selector: 'app-virtual-player-modal',
    standalone: true,
    templateUrl: './virtual-player-modal.component.html',
    styleUrl: './virtual-player-modal.component.scss',
})
export class VirtualPlayerModalComponent {
    @Input() canAddVirtualPlayer = true;
    @Output() readonly typeSelected = new EventEmitter<VirtualPlayerType>();
    @Output() readonly cancelled = new EventEmitter<void>();

    readonly virtualPlayerType = VirtualPlayerType;

    onTypeSelect(type: VirtualPlayerType): void {
        if (this.canAddVirtualPlayer) {
            this.typeSelected.emit(type);
        }
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}
