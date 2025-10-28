import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES } from '@common/enums/routes.enum';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { UiButtonComponent } from '@app/components/ui/button/button.component';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [FormsModule, UiButtonComponent, UiPageLayoutComponent],
    standalone: true,
})
export class HomePageComponent {
    teamInfo = {
        teamNumber: '204',
        members: ['Wael El Karoui', 'Ilyes Jamoussi', 'Noah Blanchard', 'Adam Rafai', 'Eduard Andrei Podaru'],
    };

    constructor(private readonly router: Router) {}

    navigateToCreateGame(): void {
        this.router.navigate([ROUTES.SessionCreationPage]);
    }

    navigateToAdminPage(): void {
        this.router.navigate([ROUTES.ManagementPage]);
    }

    navigateToJoinGame(): void {
        this.router.navigate([ROUTES.JoinSessionPage]);
    }
}
