import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';
import { UiSpinnerComponent } from '@app/shared/ui/components/spinner/spinner.component';
import { UiShapeVariant } from '@ui/types/ui.types';

@Component({
    selector: 'app-ui-button',
    standalone: true,
    imports: [CommonModule, UiSpinnerComponent],
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
})
export class UiButtonComponent extends UiBaseComponent {
    @Input() text: string = 'Button';
    @Input() icon?: string;
    @Input() iconRight: boolean = false;
    @Input() htmlType: 'button' | 'submit' | 'reset' = 'button';
    @Input() shape: UiShapeVariant = 'pill';
    @Output() buttonClick = new EventEmitter<MouseEvent>();

    onClick(e: MouseEvent): void {
        if (!this.disabled && !this.loading) {
            this?.buttonClick?.emit(e);
        }
    }

    override get classes(): Record<string, boolean> {
        return {
            uiBtn: true,
            ...super.classes,
            iconRight: !!this.icon && this.iconRight,
            iconLeft: !!this.icon && !this.iconRight,
        };
    }
}
