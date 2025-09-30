import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UiBaseComponent } from '@app/directives/ui-base/ui-base.component';
import { FaIcons } from '@common/enums/fa-icons.enum';
import { FaIconLibrary, FontAwesomeModule, SizeProp } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

export enum IconSizes {
    SM = 'xs',
    MD = 'sm',
    LG = 'lg',
}

@Component({
    selector: 'app-ui-icon',
    standalone: true,
    imports: [NgClass, FontAwesomeModule],
    template: ` <fa-icon class="uiIcon" [size]="iconSize" [icon]="iconValue" [ngClass]="classes"></fa-icon> `,
    styleUrls: ['./icon.component.scss'],
})
export class UiIconComponent extends UiBaseComponent {
    @Input() iconName: keyof typeof FaIcons = 'Coffee';

    constructor(readonly library: FaIconLibrary) {
        super();
        library.addIconPacks(fas);
    }

    get iconValue(): string {
        return FaIcons[this.iconName] || FaIcons.FaceMeh;
    }

    get iconSize(): SizeProp {
        switch (this.size) {
            case 'sm':
                return IconSizes.SM;
            case 'md':
                return IconSizes.MD;
            case 'lg':
                return IconSizes.LG;
            default:
                return IconSizes.MD;
        }
    }
}
