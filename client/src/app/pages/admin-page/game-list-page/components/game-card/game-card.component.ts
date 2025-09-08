// create a gamne card component app-game-card
import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Game } from '@app/shared/models/game.model';
import { UiCardComponent } from '@app/shared/ui/components/card/card.component';
import { UiLinkButtonComponent } from '@app/shared/ui/components/button/link-button.component';
import { RouterModule } from '@angular/router';
import { UiCheckboxComponent } from '@app/shared/ui/components/checkbox/checkbox.component';
import { UiCardTitleComponent, UiCardFooterComponent, UiCardContentComponent } from '@app/shared/ui/components/card/card-sections.component';
import { FormsModule } from '@angular/forms';

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
        UiLinkButtonComponent,
        RouterModule,
        UiCardTitleComponent,
        UiCardFooterComponent,
    ],
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
})
export class GameCardComponent {
    @Input() game!: Game;
    @Output() toggleVisibility = new EventEmitter<boolean>();
    @Output() delete = new EventEmitter<void>();
}
