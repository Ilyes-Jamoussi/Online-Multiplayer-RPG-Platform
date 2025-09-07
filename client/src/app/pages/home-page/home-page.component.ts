import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@app/shared/ui/components/button/button.component';
import { ROUTES } from '@app/constants/routes.constants';
import { UiInputComponent } from '@ui/components/input/input.component';
import { FormsModule } from '@angular/forms';
import { UiCheckboxComponent } from '@ui/components/checkbox/checkbox.component';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [ButtonComponent, CommonModule, UiInputComponent, UiCheckboxComponent, FormsModule],
    standalone: true,
})
export class HomePageComponent {
    gameName: string = 'RPG X Y Z Edition EXTREME';
    gameDescription: string = '';
    acceptTerms: boolean = false;
    hardcoreMode: boolean = false;
    variantPrimary: boolean = false;
    variantSecondary: boolean = false;
    variantSuccess: boolean = false;
    variantDanger: boolean = false;
    variantWarning: boolean = false;
    variantInfo: boolean = false;
    teamInfo = {
        teamNumber: '204',
        members: ['Wael El Karoui', 'Ilyes Jamoussi', 'Noah Blanchard', 'Adam Rafai', 'Eduard Andrei Podaru'],
    };

    constructor(private router: Router) {}

    onJoinGame(): void {
        alert('Joindre une partie - Option désactivée pour le Sprint 1');
    }

    onCreateGame(): void {
        this.router.navigate([ROUTES.createGamePage]);
    }

    onAdminGames(): void {
        this.router.navigate([ROUTES.adminPage]);
    }
}
