import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UiVariant, UiSize } from '@app/shared/ui/types/ui.types';

@Component({
    selector: 'app-ui-spinner',
    standalone: true,
    templateUrl: './spinner.component.html',
    styleUrls: ['./spinner.component.scss'],
    imports: [NgClass],
})
export class UiSpinnerComponent {
    @Input() variant: UiVariant = 'primary';
    @Input() size: UiSize = 'md';

    get classes(): Record<string, boolean> {
        return {
            uiSpinner: true,
            [`v-${this.variant}`]: true,
            [`s-${this.size}`]: true,
        };
    }
}
