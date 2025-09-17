import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'app-ui-button',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
})
export class UiButtonComponent {
    @Input() variant: ButtonVariant = 'primary';
    @Input() size: ButtonSize = 'md';
    @Input() disabled: boolean = false;
    @Input() loading: boolean = false;
    @Input() fullWidth: boolean = false;
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    
    @Output() buttonClick = new EventEmitter<MouseEvent>();

    onClick(event: MouseEvent): void {
        if (!this.disabled && !this.loading) {
            this.buttonClick.emit(event);
        }
    }

    get classes(): string {
        return [
            'ui-button',
            `ui-button--${this.variant}`,
            `ui-button--${this.size}`,
            this.disabled ? 'ui-button--disabled' : '',
            this.loading ? 'ui-button--loading' : '',
            this.fullWidth ? 'ui-button--full-width' : ''
        ].filter(Boolean).join(' ');
    }
}
