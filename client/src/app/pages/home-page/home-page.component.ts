import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UiInputComponent } from '@ui/components/input/input.component';
import { FormsModule } from '@angular/forms';
import { UiLinkButtonComponent } from '@ui/components/button/link-button.component';
import { UiCardComponent } from '@app/shared/ui/components/card/card.component';
import { UiCardTitleComponent, UiCardContentComponent } from '@app/shared/ui/components/card/card-sections.component';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [
        UiLinkButtonComponent,
        CommonModule,
        UiInputComponent,
        FormsModule,
        UiLinkButtonComponent,
        UiCardComponent,
        UiCardTitleComponent,
        UiCardContentComponent,
    ],
    standalone: true,
})
export class HomePageComponent {
    gameName: string = 'RPG Maker x2';
    teamInfo = {
        teamNumber: '204',
        members: ['Wael El Karoui', 'Ilyes Jamoussi', 'Noah Blanchard', 'Adam Rafai', 'Eduard Andrei Podaru'],
    };
}
