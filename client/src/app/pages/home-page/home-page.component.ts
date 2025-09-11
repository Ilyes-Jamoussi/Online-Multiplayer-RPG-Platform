import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { UiCardContentComponent, UiCardTitleComponent } from '@app/shared/ui/components/card/card-sections.component';
import { UiCardComponent } from '@app/shared/ui/components/card/card.component';
import { UiLinkButtonComponent } from '@ui/components/button/link-button.component';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [UiLinkButtonComponent, CommonModule, FormsModule, UiLinkButtonComponent, UiCardComponent, UiCardTitleComponent, UiCardContentComponent],
    standalone: true,
})
export class HomePageComponent {
    gameName: string = 'RPG Maker x2';
    teamInfo = {
        teamNumber: '204',
        members: ['Wael El Karoui', 'Ilyes Jamoussi', 'Noah Blanchard', 'Adam Rafai', 'Eduard Andrei Podaru'],
    };

    constructor(private router: Router) {}

    navigateToCreateGame(): void {
        this.router.navigate([ROUTES.gameSessionCreation]);
    }

    navigateToAdminPage(): void {
        this.router.navigate([ROUTES.gameManagement]);
    }
}
