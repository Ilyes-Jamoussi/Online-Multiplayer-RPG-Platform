import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiVariant, UiSize, UiShapeVariant, UiSpacing, UiAlignment } from '@app/shared/ui/types/ui.types';
import { UiSpinnerComponent } from '@app/shared/ui/components/spinner/spinner.component';

@Component({
    selector: 'app-ui-button',
    standalone: true,
    imports: [CommonModule, UiSpinnerComponent],
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
    /** Text content (if nothing in <ng-content>) */
    @Input() text: string = 'Button';

    /** Variant “global style” (color + style) */
    @Input() variant: UiVariant = 'primary';

    /** Size */
    @Input() size: UiSize = 'md';

    /** Button shape */
    @Input() shape: UiShapeVariant = 'square';

    /** Internal content alignment */
    @Input() align: UiAlignment = 'center';

    /** Spacing between icon and text */
    @Input() gap: UiSpacing = 'sm';

    /** Disabled / loading */
    @Input() disabled: boolean = false;
    @Input() loading: boolean = false;

    /** Optional icon (Material icon name or text/emoji) */
    @Input() icon?: string;
    @Input() iconRight: boolean = false; // false = icon on left, true = on right

    /** Full width */
    @Input() fullWidth: boolean = false;

    /** HTML button type */
    @Input() htmlType: 'button' | 'submit' | 'reset' = 'button';

    @Output() buttonClick = new EventEmitter<MouseEvent>();

    onClick(e: MouseEvent): void {
        if (!this.disabled && !this.loading) {
            this.buttonClick.emit(e);
        }
    }

    get classes(): Record<string, boolean> {
        return {
            uiBtn: true,

            // variantes
            [`v-${this.variant}`]: true,

            // tailles
            [`s-${this.size}`]: true,

            // formes
            [`sh-${this.shape}`]: true,

            // alignements
            [`al-${this.align}`]: true,

            // gaps
            [`gap-${this.gap}`]: true,

            // états
            isDisabled: this.disabled,
            isLoading: this.loading,
            isFull: this.fullWidth,
            iconRight: !!this.icon && this.iconRight,
            iconLeft: !!this.icon && !this.iconRight,
        };
    }
}
