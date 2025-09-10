import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';
import { FaIconKey, UiShapeVariant } from '@ui/types/ui.types';
import { UiIconComponent } from '@ui/components/icon/icon.component';

@Component({
    selector: 'app-ui-link-button',
    standalone: true,
    imports: [CommonModule, RouterModule, UiIconComponent],
    templateUrl: './link-button.component.html',
    styleUrls: ['./button.component.scss'],
})
export class UiLinkButtonComponent extends UiBaseComponent {
    /** Optional icon (Material icon name or text/emoji) */
    @Input() icon?: FaIconKey;
    @Input() iconRight: boolean = false; // false = icon on left, true = on right

    /** Router link parameters */
    @Input() routerLink!: string | string[];
    @Input() queryParams?: { [k: string]: unknown };
    @Input() fragment?: string;
    @Input() target?: string;
    @Input() routerLinkActive?: string | string[];

    /** Override default shape */
    @Input() shape: UiShapeVariant = 'pill';

    override get classes(): Record<string, boolean> {
        return {
            uiBtn: true,
            linkBtn: true,
            ...super.classes,
            iconRight: !!this.icon && this.iconRight,
            iconLeft: !!this.icon && !this.iconRight,
        };
    }
}
