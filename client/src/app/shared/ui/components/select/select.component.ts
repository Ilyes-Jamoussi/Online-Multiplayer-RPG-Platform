import { NgClass } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UI_CONSTANTS } from '@app/constants/ui.constants';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';
import { UiIconComponent } from '@app/shared/ui/components/icon/icon.component';
import { FaIconKey } from '@ui/types/ui.types';

@Component({
    selector: 'app-ui-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    standalone: true,
    imports: [NgClass, UiIconComponent],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UiSelectComponent),
            multi: true,
        },
    ],
})
export class UiSelectComponent extends UiBaseComponent implements ControlValueAccessor {
    /** Text alignment inside the select (overrides base align for select field) */
    @Input() alignText?: string = 'left';

    /** Label for the select */
    @Input() label: string = '';

    /** Icon to display before the select */
    @Input() prefixIcon?: FaIconKey;

    /** Placeholder text for the select */
    @Input() placeholder: string = '';

    /** Whether the select is required */
    @Input() required: boolean = false;

    /** Unique ID for the select element */
    readonly id: string = `select_${this.generateUniqueId()}`;

    value: string = '';
    isDisabled = false;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private onChange: (value: string) => void = () => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private onTouched: () => void = () => {};

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

    onSelectChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.value = select.value;
        this.onChange(this.value);
    }

    onBlur(): void {
        this.onTouched();
    }

    private generateUniqueId(): string {
        return (
            Date.now().toString(UI_CONSTANTS.select.base36) +
            Math.floor(Math.random() * UI_CONSTANTS.select.randomMultiplier).toString(UI_CONSTANTS.select.base36)
        );
    }

    override get classes(): Record<string, boolean> {
        return {
            uiSelect: true,
            ...super.classes,
            [`al-${this.alignText ?? 'left'}`]: true,
            isDisabled: !!this.disabled || !!this.isDisabled,
            isLoading: !!this.loading,
            hasPrefixIcon: !!this.prefixIcon,
            hasLabel: !!this.label,
        };
    }
}
