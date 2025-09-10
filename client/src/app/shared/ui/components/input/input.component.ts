import { NgClass } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';
import { UiIconComponent } from '@app/shared/ui/components/icon/icon.component';
import { FaIconKey } from '@ui/types/ui.types';

type InputType = 'text' | 'number' | 'password' | 'email' | 'tel' | 'url';

@Component({
    selector: 'app-ui-input',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.scss'],
    standalone: true,
    imports: [NgClass, UiIconComponent],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UiInputComponent),
            multi: true,
        },
    ],
})
export class UiInputComponent extends UiBaseComponent implements ControlValueAccessor {
    /** Text alignment inside the input (overrides base align for input field) */
    @Input() alignText?: string = 'left';

    /** Whether the input can be cleared */
    @Input() clearable: boolean = false;

    /** Label for the input */
    @Input() label: string = '';

    /** Maximum length of the input value */
    @Input() maxLength?: number;

    /** Minimum length of the input value */
    @Input() minLength?: number;

    /** Icon to display before the input */
    @Input() prefixIcon?: FaIconKey;

    /** Placeholder text for the input */
    @Input() placeholder: string = '';

    /** Whether the input is required */
    @Input() required: boolean = false;

    /** Icon to display after the input */
    @Input() suffixIcon?: FaIconKey;

    /** Type of the input */
    @Input() type: InputType = 'text';

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

    override get classes(): Record<string, boolean> {
        return {
            uiInput: true,
            ...super.classes,
            [`al-${this.alignText ?? 'left'}`]: true,
            isDisabled: !!this.disabled || !!this.isDisabled,
            isLoading: !!this.loading,
            hasPrefixIcon: !!this.prefixIcon,
            hasSuffixIcon: !!this.suffixIcon,
            isClearable: !!this.clearable,
            hasLabel: !!this.label,
            disableHoverEffects: true,
        };
    }
}
