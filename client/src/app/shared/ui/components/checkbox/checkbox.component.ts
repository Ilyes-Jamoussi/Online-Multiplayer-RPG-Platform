import { CommonModule } from '@angular/common';
import { Component, forwardRef, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UiVariant, UiSize, UiShapeVariant } from '@app/shared/ui/types/ui.types';

@Component({
    selector: 'app-ui-checkbox',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './checkbox.component.html',
    styleUrls: ['./checkbox.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UiCheckboxComponent),
            multi: true,
        },
    ],
})
export class UiCheckboxComponent implements ControlValueAccessor {
    /** Variant: global style (color + style) */
    @Input() variant: UiVariant = 'primary';

    /** Size */
    @Input() size: UiSize = 'md';

    /** Checkbox shape */
    @Input() shape: UiShapeVariant = 'square';

    /** Label text */
    @Input() label: string = '';

    /** Disabled state */
    @Input() disabled: boolean = false;

    /** Value state */
    @Input() value: boolean = false;

    /** Value changed event */
    @Output() valueChange = new EventEmitter<boolean>();

    // ControlValueAccessor implementation
    onChange: (value: boolean) => void;
    onTouch: () => void;

    writeValue(value: boolean): void {
        this.value = value;
    }

    registerOnChange(fn: (value: boolean) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouch = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    toggleValue(event: MouseEvent): void {
        event.preventDefault();

        if (this.disabled) return;

        this.value = !this.value;
        this.valueChange.emit(this.value);
        this.onChange(this.value);
        this.onTouch();
    }

    get classes(): Record<string, boolean> {
        return {
            uiCheckbox: true,

            // variants
            [`v-${this.variant}`]: true,

            // sizes
            [`s-${this.size}`]: true,

            // shapes
            [`sh-${this.shape}`]: true,

            // states
            isDisabled: this.disabled,
            isChecked: this.value,
        };
    }
}
