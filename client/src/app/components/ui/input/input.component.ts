import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { NUMBER_ALLOWED_CHARS_PATTERN, TEXT_ALLOWED_CHARS_PATTERN } from '@app/constants/validation.constants';

@Component({
    selector: 'app-ui-input',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.scss'],
    standalone: true,
})
export class UiInputComponent {
    private _value: string = '';

    @Input() placeholder: string = '';
    @Input() type: 'text' | 'number' | 'textarea' = 'text';
    @Input() maxLength?: number;
    @Input() fullWidth: boolean = false;

    @Input() set value(val: string) {
        if (val !== undefined) {
            this._value = val;
        }
    }

    @Output() valueChange = new EventEmitter<string>();

    @HostBinding('class.full-width')
    get isFullWidth() {
        return this.fullWidth;
    }

    get value(): string {
        return this._value;
    }

    onKeyDown(event: KeyboardEvent): void {
        const input = event.target as HTMLInputElement | HTMLTextAreaElement;
        const selectionStart = input.selectionStart ?? 0;
        const selectionEnd = input.selectionEnd ?? 0;
        const hasSelection = selectionStart !== selectionEnd;

        if (event.key === ' ' && this.isSpaceInvalid(input.value, hasSelection, selectionStart)) {
            event.preventDefault();
            return;
        }
        if (event.key.length === 1 && !this.isValidChar(event.key)) {
            event.preventDefault();
        }
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement | HTMLTextAreaElement;
        const SPACE_DOT_LENGTH = 2;
        let value = input.value;

        if (value.endsWith('. ')) {
            value = value.slice(0, -SPACE_DOT_LENGTH) + ' ';
            input.value = value;
        }
        value = this.filterInvalidChars(value);

        this._value = value;
        this.valueChange.emit(this._value);
    }

    private isValidChar(char: string): boolean {
        const pattern = this.type === 'number' ? NUMBER_ALLOWED_CHARS_PATTERN : TEXT_ALLOWED_CHARS_PATTERN;
        return pattern.test(char);
    }

    private isSpaceInvalid(value: string, hasSelection: boolean, selectionStart: number): boolean {
        return this.type === 'number' || (!hasSelection && (value.length === 0 || value.endsWith(' '))) || (hasSelection && selectionStart === 0);
    }

    private filterInvalidChars(value: string): string {
        const pattern = this.type === 'number' ? NUMBER_ALLOWED_CHARS_PATTERN : TEXT_ALLOWED_CHARS_PATTERN;
        return [...value].filter((c) => pattern.test(c) || c === ' ').join('');
    }
}
