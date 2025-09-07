import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UiInputComponent } from '@ui/components/input/input.component';
import { FormsModule } from '@angular/forms';
import { UiCheckboxComponent } from '@ui/components/checkbox/checkbox.component';
import { UiLinkButtonComponent } from '@ui/components/button/link-button.component';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [UiLinkButtonComponent, CommonModule, UiInputComponent, UiCheckboxComponent, FormsModule, UiLinkButtonComponent],
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
}
