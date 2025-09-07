import { CommonModule } from '@angular/common';
import { Component, forwardRef, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UiBaseComponent } from '@ui/components/ui-base.component';

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
export class UiCheckboxComponent extends UiBaseComponent implements ControlValueAccessor {
    /** Label text */
    @Input() label: string = '';

    /** Value state */
    @Input() value: boolean = false;

    /** Value changed event */
    @Output() valueChange = new EventEmitter<boolean>();

    // ControlValueAccessor implementation
    // Placeholder for ControlValueAccessor; will be set by Angular forms
    onChange: (value: boolean) => void = () => { /* no-op */ };
    onTouch: () => void = () => { /* no-op */ };

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

    override get classes(): Record<string, boolean> {
        return {
            uiCheckbox: true,
            ...super.classes,
            isChecked: this.value,
        };
    }
}
