import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UiAlignment } from '@app/shared/ui/types/ui.types';

@Component({
    selector: 'app-ui-card-title',
    standalone: true,
    imports: [NgClass],
    styleUrls: ['./card.component.scss'],
    template: `
        <div class="uiCard__title" [ngClass]="classes">
            @if (icon) { <span class="material-icons">{{ icon }}</span> }
            <span class="title-slot"><ng-content /></span>
        </div>
    `,
})
export class UiCardTitleComponent {
    /** Nom d’icône Material (ou texte/emoji) */
    @Input() icon?: string;
    /** Centre le titre horizontalement */
    @Input() alignText: UiAlignment = 'left';

    get classes(): Record<string, boolean> {
        return {
            [`al-${this.alignText}`]: true,
        };
    }
}

@Component({
    selector: 'app-ui-card-content',
    styleUrls: ['./card.component.scss'],
    standalone: true,
    template: `<div class="uiCard__content"><ng-content /></div>`,
})
export class UiCardContentComponent {}

@Component({
    selector: 'app-ui-card-footer',
    styleUrls: ['./card.component.scss'],
    standalone: true,
    template: `<div class="uiCard__footer"><ng-content /></div>`,
})
export class UiCardFooterComponent {}
