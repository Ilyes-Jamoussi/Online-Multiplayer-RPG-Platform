import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UiBaseComponent } from '@app/shared/ui/components/ui-base.component';

@Component({
    selector: 'app-ui-link-button',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './link-button.component.html',
    styleUrls: ['./button.component.scss'],
})
export class UiLinkButtonComponent extends UiBaseComponent {
    /** Optional icon (Material icon name or text/emoji) */
    @Input() icon?: string;
    @Input() iconRight: boolean = false;

    /** Router link parameters */
    @Input() routerLink!: string | string[];
    @Input() queryParams?: { [k: string]: unknown };
    @Input() fragment?: string;
    @Input() target?: string;
    @Input() routerLinkActive?: string | string[];

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
