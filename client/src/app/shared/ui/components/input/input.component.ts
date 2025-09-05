import { NgClass } from '@angular/common';
import { Component, forwardRef, HostBinding, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

type InputSize = 'sm' | 'md' | 'lg';
type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';

@Component({
    selector: 'app-ui-input',
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule, MatIconModule, NgClass],
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.scss', '../../../styles/common.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => UiInputComponent),
        },
    ],
})
export class UiInputComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() fullWidth = false;
    @Input() size: InputSize = 'md';
    @Input() customStyle: Record<string, string> = {};
    @Input() disabled = false;
    @Input() type: InputType = 'text';

    textValue = '';

    @HostBinding('class.ui-full')
    get hostFullWidth() {
        return this.fullWidth;
    }

    get classes() {
        return [`ui-input`, `ui-input-${this.size}`, this.fullWidth ? 'ui-input-full' : '', this.disabled ? 'ui-input-disabled' : ''].join(' ');
    }

    private onChange: (value: string) => void;
    private onTouched: () => void;

    // ---- ControlValueAccessor API ----
    writeValue(value: string): void {
        this.textValue = value ?? '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // ---- Handlers ----
    handleInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.textValue = input.value;
        this.onChange(this.textValue);
    }

    handleBlur(): void {
        this.onTouched();
    }
}
