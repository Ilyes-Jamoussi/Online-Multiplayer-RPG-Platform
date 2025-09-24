import { NgClass } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';
import { NAME_INVALID_CHARS_PATTERN, NAME_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from '@app/constants/validation.constants';

type InputType = 'name' | 'description';

@Component({
    selector: 'app-ui-input',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.scss'],
    standalone: true,
    imports: [NgClass],
})
export class UiInputComponent extends UiBaseComponent {
    @Input() placeholder: string = '';
    @Input() type: InputType = 'name';
    @Input() value: string = '';
    @Input() disabled: boolean = false;

    @Output() valueChange = new EventEmitter<string>();

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        let value = input.value;

        if (this.type === 'name') {
            value = value.replace(NAME_INVALID_CHARS_PATTERN, '');
            value = value.slice(0, NAME_MAX_LENGTH);
        } else if (this.type === 'description') {
            value = value.slice(0, DESCRIPTION_MAX_LENGTH);
        }

        input.value = value;
        this.valueChange.emit(value);
    }

    override get classes(): Record<string, boolean> {
        return {
            uiInput: true,
            ...super.classes,
            isDisabled: this.disabled,
        };
    }
}
