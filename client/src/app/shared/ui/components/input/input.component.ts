import { NgClass } from '@angular/common';
import { Component, forwardRef, Input, Output, EventEmitter } from '@angular/core';
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
    @Input() label: string = '';
    @Input() placeholder: string = '';
    @Input() type: InputType = 'text';
    @Input() required: boolean = false;
    @Input() clearable: boolean = false;
    @Input() maxLength?: number;
    @Input() minLength?: number;
    @Input() prefixIcon?: FaIconKey;
    @Input() suffixIcon?: FaIconKey;
    @Input() errorMessage: string = '';
    @Input() set initialValue(val: string) {
        if (val !== undefined) {
            this.value = val;
        }
    }

    @Output() valueChange = new EventEmitter<string>();

    value: string = '';
    isDisabled = false;
    isTouched = false;

    private onChangeCallback = (value: string): void => {
        this.valueChange.emit(value);
    };
    private onTouchedCallback = (): void => {
        this.isTouched = true;
    };

    writeValue(value: string): void {
        this.value = value || '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChangeCallback = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouchedCallback = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.value = input.value;
        this.onChangeCallback(this.value);
        this.valueChange.emit(this.value);
    }

    onClear(): void {
        this.value = '';
        this.onChangeCallback(this.value);
        this.valueChange.emit(this.value);
    }

    onBlur(): void {
        this.isTouched = true;
        this.onTouchedCallback();
    }

    get hasError(): boolean {
        return this.isTouched && !!this.errorMessage;
    }

    get isValid(): boolean {
        return this.isTouched && !this.errorMessage && this.value.length > 0;
    }

    override get classes(): Record<string, boolean> {
        return {
            uiInput: true,
            ...super.classes,
            isDisabled: this.isDisabled,
            hasError: this.hasError,
            isValid: this.isValid,
            hasPrefixIcon: !!this.prefixIcon,
            hasSuffixIcon: !!this.suffixIcon,
            isClearable: this.clearable,
            hasLabel: !!this.label,
        };
    }
}
