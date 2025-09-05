import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

type ButtonVariant = 'elevated' | 'outlined' | 'filled' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonColor = 'primary' | 'accent' | 'warn' | 'error';

@Component({
    selector: 'app-ui-button',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, NgStyle, NgClass],
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss', '../../../styles/common.scss'],
})
export class UiButtonComponent {
    @Input() variant: ButtonVariant = 'filled';
    @Input() size: ButtonSize = 'md';
    @Input() disabled = false;
    @Input() fullWidth = false;
    @Input() customStyle: Record<string, string> = {};
    @Input() iconName: string | null = null;
    @Input() color: ButtonColor = 'primary';

    @Output() onClick = new EventEmitter<Event>();

    @HostBinding('class.ui-full')
    get hostFullWidth() {
        return this.fullWidth;
    }

    handleClick(event: Event) {
        if (!this.disabled) {
            this.onClick.emit(event);
        }
    }

    get matButtonType(): ButtonVariant {
        return this.variant;
    }

    get classes() {
        return [`ui-btn`, `ui-btn-${this.size}`, this.fullWidth ? 'ui-btn-full' : ''].join(' ');
    }
}
