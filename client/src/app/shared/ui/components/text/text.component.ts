import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';

@Component({
    selector: 'app-ui-text',
    imports: [CommonModule],
    templateUrl: './text.component.html',
    styleUrl: './text.component.scss',
})
export class UiTextComponent extends UiBaseComponent {
    @Input() textVariant: 'title' | 'subtitle' | 'body' | 'caption' | 'label' = 'body';
    @Input() weight: 'normal' | 'bold' | 'light' = 'normal';
    @Input() element: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div' = 'span';

    override get classes(): Record<string, boolean> {
        return {
            ...super.classes,
            uiText: true,
            [`text-variant-${this.textVariant}`]: true,
            [`weight-${this.weight}`]: true,
        };
    }
}
