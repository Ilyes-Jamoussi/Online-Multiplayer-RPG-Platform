import { Component } from '@angular/core';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { FormsModule } from '@angular/forms';
import { UiInputComponent } from '@app/shared/ui/components/input/input.component';

// showcase dev page for shared ui components
@Component({
    selector: 'app-ui-showcase-page',
    templateUrl: './ui-showcase-page.component.html',
    styleUrls: ['./ui-showcase-page.component.scss'],
    imports: [UiButtonComponent, MatGridListModule, FormsModule, UiInputComponent],
    standalone: true,
})
export class UiShowcasePageComponent {
    selectSegValue: string | null = null;
    username: string = 'JohnDoe';

    // just a demo handler for the button click event
    handleButtonClick() {
        alert('Button clicked!');
    }
}
