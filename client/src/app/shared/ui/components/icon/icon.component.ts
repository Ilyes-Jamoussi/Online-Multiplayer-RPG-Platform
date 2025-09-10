import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FaIconLibrary, FontAwesomeModule, SizeProp } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { UiBaseComponent } from '@ui/components/base/ui-base.component';
import { FaIcons } from '@ui/types/ui.types';

const ICON_SIZES = {
    sm: 'xs' as SizeProp,
    md: 'sm' as SizeProp,
    lg: 'lg' as SizeProp,
};

@Component({
    selector: 'app-ui-icon',
    standalone: true,
    imports: [NgClass, FontAwesomeModule],
    template: ` <fa-icon [size]="iconSize" [icon]="iconValue" [ngClass]="classes"></fa-icon> `,
    styleUrls: ['./icon.component.scss'],
})
export class UiIconComponent extends UiBaseComponent {
    @Input() iconName: keyof typeof FaIcons = 'Coffee'; // Default to lowercase for FontAwesome compatibility

    constructor(library: FaIconLibrary) {
        super();
        library.addIconPacks(fas); // Ensure FontAwesome icons are registered
    }

    get classes(): Record<string, boolean> {
        return {
            uiIcon: true,
            ...super.classes,
        };
    }

    get iconValue(): string {
        return FaIcons[this.iconName] || FaIcons.FaceMeh;
    }

    get iconSize(): SizeProp {
        switch (this.size) {
            case 'sm':
                return ICON_SIZES.sm;
            case 'md':
                return ICON_SIZES.md;
            case 'lg':
                return ICON_SIZES.lg;
            default:
                return ICON_SIZES.md; // Default size
        }
    }
}
