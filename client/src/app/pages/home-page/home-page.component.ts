import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiCardComponent } from '@app/shared/ui/components/card/card.component';
import { UiCardTitleComponent, UiCardContentComponent } from '@app/shared/ui/components/card/card-sections.component';
import { UiLinkButtonComponent2 } from '@app/shared/ui/components/button/link-button2.component';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [CommonModule, FormsModule, UiCardComponent, UiCardTitleComponent, UiCardContentComponent, UiLinkButtonComponent2],
    standalone: true,
})
export class HomePageComponent {
    gameName: string = 'RPG Maker x2';
    teamInfo = {
        teamNumber: '204',
        members: ['Wael El Karoui', 'Ilyes Jamoussi', 'Noah Blanchard', 'Adam Rafai', 'Eduard Andrei Podaru'],
    };
    selectedCountry: string = '';
}
