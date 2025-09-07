import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UiBaseComponent } from '@ui/components/base/ui-base.component';
import { MaterialIcon } from '@ui/types/ui.types';

@Component({
    selector: 'app-ui-icon',
    standalone: true,
    imports: [NgClass],
    template: `<span class="material-icons" [ngClass]="classes">{{ iconValue }}</span>`,
    styleUrls: ['./icon.component.scss'],
})
export class UiIconComponent extends UiBaseComponent {
    @Input() iconName: keyof typeof MaterialIcon = 'Home';

    get iconValue(): string {
        return MaterialIcon[this.iconName];
    }

    get classes(): Record<string, boolean> {
        return {
            uiIcon: true,
            ...super.classes,
        };
    }
}
