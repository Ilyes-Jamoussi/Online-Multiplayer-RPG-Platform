import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { UiBase2Component } from '@app/shared/ui/components/base/ui-base2.component';
import { UiIconComponent } from '@app/shared/ui/components/icon/icon.component'; // Corrected import path
import { FaIconKey } from '@ui/types/ui.types';
import { UiFontWeight, UiTextTransform } from '@ui/types/ui2.types';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-ui-link-button2',
    standalone: true,
    imports: [NgClass, UiIconComponent, RouterModule],
    templateUrl: './link-button2.component.html',
    styleUrls: ['./button2.component.scss'],
})
export class UiLinkButtonComponent2 extends UiBase2Component {
    /** Type natif du bouton */
    @Input() type: 'button' | 'submit' | 'reset' = 'button';

    /** Icons */
    @Input() leftIcon?: FaIconKey;
    @Input() rightIcon?: FaIconKey;

    /** Poids de la police */
    @Input() fontWeight: UiFontWeight = 'bold';

    /** Transformations de texte */
    @Input() textTransform: UiTextTransform = 'uppercase';

    /** Router link parameters */
    @Input() routerLink!: string | string[];
    @Input() queryParams?: { [k: string]: unknown };
    @Input() fragment?: string;
    @Input() target?: string;
    @Input() routerLinkActive?: string | string[];
}
