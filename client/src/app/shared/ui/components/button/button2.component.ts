import { Component, ChangeDetectionStrategy, EventEmitter, Output, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { UiBase2Component } from '@app/shared/ui/components/base/ui-base2.component';
import { UiIconComponent } from '@app/shared/ui/components/icon/icon.component'; // Corrected import path
import { FaIconKey } from '@ui/types/ui.types';
import { UiFontWeight, UiTextTransform } from '@ui/types/ui2.types';

@Component({
    selector: 'app-ui-button2',
    standalone: true,
    imports: [NgClass, UiIconComponent],
    templateUrl: './button2.component.html',
    styleUrls: ['./button2.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent2 extends UiBase2Component {
    /** Texte si on n’utilise pas <ng-content> */
    @Input() label = '';

    /** Type natif du bouton */
    @Input() type: 'button' | 'submit' | 'reset' = 'button';

    /** Icons */
    @Input() leftIcon?: FaIconKey;
    @Input() rightIcon?: FaIconKey;

    /** Poids de la police */
    @Input() fontWeight: UiFontWeight = 'bold';

    /** Transformations de texte */
    @Input() textTransform: UiTextTransform = 'uppercase';

    /** Button press event */
    @Output() pressed = new EventEmitter<MouseEvent>();

    handleClick(ev: MouseEvent) {
        if (this.disabled || this.loading) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            return;
        }
        this.pressed.emit(ev);
    }
}
