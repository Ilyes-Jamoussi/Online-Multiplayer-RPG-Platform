import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';

@Component({
    selector: 'app-ui-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss'],
})
export class UiCardComponent extends UiBaseComponent {
    override get classes(): Record<string, boolean> {
        return {
            uiCard: true,
            ...super.classes,
        };
    }
}
