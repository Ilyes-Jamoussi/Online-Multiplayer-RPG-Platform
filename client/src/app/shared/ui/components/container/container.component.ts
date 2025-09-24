import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';

@Component({
    selector: 'app-ui-container',
    imports: [CommonModule],
    templateUrl: './container.component.html',
    styleUrl: './container.component.scss',
})
export class UiContainerComponent extends UiBaseComponent {
    @Input() layout: 'flex' | 'grid' | 'center' = 'flex';
    @Input() padding: 'sm' | 'md' | 'lg' = 'md';
    @Input() height: 'auto' | 'screen' | 'full' = 'screen';

    override get classes(): Record<string, boolean> {
        return {
            ...super.classes,
            uiContainer: true,
            [`layout-${this.layout}`]: true,
            [`padding-${this.padding}`]: true,
            [`height-${this.height}`]: true,
        };
    }
}
