import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UiInputComponent } from '@ui/components/input/input.component';
import { FormsModule } from '@angular/forms';
import { UiLinkButtonComponent } from '@ui/components/button/link-button.component';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [UiLinkButtonComponent, CommonModule, UiInputComponent, FormsModule, UiLinkButtonComponent],
    standalone: true,
})
export class HomePageComponent {
    gameName: string = 'Le Grand RPG';
    teamInfo = {
        teamNumber: '204',
        members: ['Wael El Karoui', 'Ilyes Jamoussi', 'Noah Blanchard', 'Adam Rafai', 'Eduard Andrei Podaru'],
    };
}
