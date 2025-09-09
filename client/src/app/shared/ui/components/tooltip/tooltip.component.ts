import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';
import { UiSize } from '@ui/types/ui.types';

@Component({
    selector: 'app-ui-tooltip',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tooltip.component.html',
    styleUrls: ['./tooltip.component.scss'],
})
export class UiTooltipComponent extends UiBaseComponent {
    @Input() text: string = '';
    @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
    @Input() distance: UiSize = 'md';

    isVisible: boolean = false;

    showTooltip(): void {
        this.isVisible = this.text.length > 0;
    }

    hideTooltip(): void {
        this.isVisible = false;
    }

    override get classes(): Record<string, boolean> {
        return {
            uiTooltip: true,
            ...super.classes,
            top: this.position === 'top',
            bottom: this.position === 'bottom',
            left: this.position === 'left',
            right: this.position === 'right',
            visible: this.isVisible,
            [`dist-${this.distance}`]: true,
        };
    }
}
