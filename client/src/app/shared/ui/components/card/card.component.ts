import { CommonModule } from '@angular/common';
import { Component, InjectionToken } from '@angular/core';
import { UiCardContext } from '@app/interfaces/ui-card.interface';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';

export const UI_CARD_CONTEXT = new InjectionToken<UiCardContext>('UI_CARD_CONTEXT');

@Component({
    selector: 'app-ui-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss'],
    providers: [
        {
            provide: UI_CARD_CONTEXT,
            useFactory: (card: UiCardComponent) => ({
                variant: card.variant,
                size: card.size,
                shape: card.shape,
                align: card.alignContent,
                gap: card.gap,
                elevation: card.elevation,
            }),
            deps: [UiCardComponent],
        },
    ],
})
export class UiCardComponent extends UiBaseComponent {
    override get classes(): Record<string, boolean> {
        return {
            uiCard: true,
            ...super.classes,
        };
    }
}
