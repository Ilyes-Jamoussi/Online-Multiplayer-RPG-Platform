import { NgClass } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UiAlignment, UiShapeVariant, UiSize, UiVariant } from '@app/shared/ui/types/ui.types';

type InputType = 'text' | 'number' | 'password' | 'email' | 'tel' | 'url';

@Component({
    selector: 'app-ui-input',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.scss'],
    standalone: true,
    imports: [NgClass],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UiInputComponent),
            multi: true,
        },
    ],
})
export class UiInputComponent implements ControlValueAccessor {
    /** Text alignment inside the input */
    @Input() alignText?: UiAlignment = 'left';

    /** Whether the input can be cleared */
    @Input() clearable: boolean = false;

    /** Whether the input is disabled */
    @Input() disabled?: boolean = false;

    /** Whether the input should take full width */
    @Input() fullWidth?: boolean = false;

    /** Shows a loading indicator */
    @Input() loading?: boolean = true;

    /** Label for the input */
    @Input() label: string = '';

    /** Maximum length of the input value */
    @Input() maxLength?: number;

    /** Minimum length of the input value */
    @Input() minLength?: number;

    /** Icon to display before the input */
    @Input() prefixIcon?: string;

    /** Placeholder text for the input */
    @Input() placeholder: string = '';

    /** Whether the input is required */
    @Input() required: boolean = false;

    /** Shape variant of the input */
    @Input() shape?: UiShapeVariant = 'square';

    /** Size of the input */
    @Input() size: UiSize = 'md';

    /** Icon to display after the input */
    @Input() suffixIcon?: string;

    /** Type of the input */
    @Input() type: InputType = 'text';

    /** Visual variant of the input */
    @Input() variant: UiVariant = 'primary';

    value: string = '';
    isDisabled = false;

    private onChange: (value: string) => void;
    private onTouched: () => void;

    writeValue(obj: string): void {
        this.value = obj;
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.value = input.value;
        this?.onChange?.(this.value);
    }

    onClear(): void {
        this.value = '';
        this?.onChange?.(this.value);
    }

    onBlur(): void {
        this?.onTouched?.();
    }

    get classes(): Record<string, boolean> {
        return {
            uiInput: true,

            [`v-${this.variant ?? 'primary'}`]: true,

            [`s-${this.size ?? 'md'}`]: true,

            [`sh-${this.shape ?? 'rounded'}`]: true,

            [`al-${this.alignText ?? 'left'}`]: true,

            isFull: !!this.fullWidth,
            isDisabled: !!this.disabled || !!this.isDisabled,
            isLoading: !!this.loading,

            hasPrefixIcon: !!this.prefixIcon,
            hasSuffixIcon: !!this.suffixIcon,
            isClearable: !!this.clearable,
            hasLabel: !!this.label,
        };
    }
}
