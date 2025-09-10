// create a gamne card component app-game-card
import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Game } from '@app/shared/models/game.model';
import { UiCardComponent } from '@app/shared/ui/components/card/card.component';
import { RouterModule } from '@angular/router';
import { UiCheckboxComponent } from '@app/shared/ui/components/checkbox/checkbox.component';
import { UiCardTitleComponent, UiCardFooterComponent, UiCardContentComponent } from '@app/shared/ui/components/card/card-sections.component';
import { FormsModule } from '@angular/forms';
import { UiLinkButtonComponent2 } from '@app/shared/ui/components/button/link-button2.component';
import { UiTooltipComponent } from '@app/shared/ui/components/tooltip/tooltip.component';

@Component({
    selector: 'app-game-card',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        UiCardComponent,
        UiCardContentComponent,
        UiCheckboxComponent,
        DatePipe,
        RouterModule,
        UiCardTitleComponent,
        UiCardFooterComponent,
        UiLinkButtonComponent2,
        UiTooltipComponent,
    ],
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
})
export class GameCardComponent {
    @Input() game!: Game;
    @Input() admin: boolean = false;
    @Output() toggleVisibility = new EventEmitter<boolean>();
    @Output() delete = new EventEmitter<void>();
}
