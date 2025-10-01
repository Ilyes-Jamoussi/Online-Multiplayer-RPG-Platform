import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { UiButtonComponent } from '@app/components/ui/button/button.component';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [CommonModule, FormsModule, UiButtonComponent, UiPageLayoutComponent],
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
