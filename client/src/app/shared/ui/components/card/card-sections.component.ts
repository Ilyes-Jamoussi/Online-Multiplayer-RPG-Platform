import { NgClass } from '@angular/common';
import { Component, Inject, Input, Optional } from '@angular/core';
import { MaterialIcon, UiAlignment } from '@app/shared/ui/types/ui.types';
import { UiBaseComponent } from '@ui/components/base/ui-base.component';
import { UiIconComponent } from '@ui/components/icon/icon.component';
import { UI_CARD_CONTEXT, UiCardContext } from './card.component';

@Component({
    selector: 'app-ui-card-title',
    standalone: true,
    imports: [NgClass, UiIconComponent],
    styleUrls: ['./card.component.scss'],
    template: `
        <div class="uiCard__title" [ngClass]="classes">
            @if(icon){<app-ui-icon [variant]="variant" [iconName]="icon" />}
            <span class="title-slot"><ng-content /></span>
        </div>
    `,
})
export class UiCardTitleComponent extends UiBaseComponent {
    /** Material icon name (or text/emoji) */
    @Input() icon?: keyof typeof MaterialIcon;
    /** Center the title horizontally */
    @Input() alignText: UiAlignment = 'left';
    /** Place the icon to the right */
    @Input() iconRight: boolean = false;

    constructor(@Optional() @Inject(UI_CARD_CONTEXT) private cardContext?: UiCardContext) {
        super();
        if (this.cardContext) {
            this.variant = this.cardContext.variant;
            this.size = this.cardContext.size;
            this.shape = this.cardContext.shape;
            this.alignContent = this.cardContext.align;
            this.gap = this.cardContext.gap;
            this.elevation = this.cardContext.elevation;
        }
    }

    get classes(): Record<string, boolean> {
        return {
            ...super.classes,
            [`icon-right`]: this.iconRight,
            [`al-${this.alignText}`]: true,
        };
    }
}

@Component({
    selector: 'app-ui-card-content',
    styleUrls: ['./card.component.scss'],
    imports: [NgClass],
    standalone: true,
    template: `<div class="uiCard__content" [ngClass]="classes"><ng-content /></div>`,
})
export class UiCardContentComponent extends UiBaseComponent {
    @Input() alignContent: UiAlignment = 'left';

    constructor(@Optional() @Inject(UI_CARD_CONTEXT) private cardContext?: UiCardContext) {
        super();
        if (this.cardContext) {
            this.variant = this.cardContext.variant;
            this.size = this.cardContext.size;
            this.shape = this.cardContext.shape;
            this.alignContent = this.cardContext.align;
            this.gap = this.cardContext.gap;
            this.elevation = this.cardContext.elevation;
        }
    }

    get classes(): Record<string, boolean> {
        return {
            ...super.classes,
            [`al-${this.alignContent}`]: true,
        };
    }
}

@Component({
    selector: 'app-ui-card-footer',
    styleUrls: ['./card.component.scss'],
    standalone: true,
    imports: [NgClass],
    template: `<div class="uiCard__footer" [ngClass]="classes"><ng-content /></div>`,
})
export class UiCardFooterComponent extends UiBaseComponent {
    @Input() alignText: UiAlignment = 'left';

    constructor(@Optional() @Inject(UI_CARD_CONTEXT) private cardContext?: UiCardContext) {
        super();
        if (this.cardContext) {
            this.variant = this.cardContext.variant;
            this.size = this.cardContext.size;
            this.shape = this.cardContext.shape;
            this.alignContent = this.cardContext.align;
            this.gap = this.cardContext.gap;
            this.elevation = this.cardContext.elevation;
        }
    }

    get classes(): Record<string, boolean> {
        return {
            ...super.classes,
            [`al-${this.alignText}`]: true,
        };
    }
}
