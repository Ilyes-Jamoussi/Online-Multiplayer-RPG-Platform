import { Component } from '@angular/core';
import { UiButtonComponent } from '@app/shared/components/ui/button/button.component';
import { MatGridListModule } from '@angular/material/grid-list';

// showcase dev page for shared ui components
@Component({
    selector: 'app-ui-showcase-page',
    templateUrl: './ui-showcase-page.component.html',
    styleUrls: ['./ui-showcase-page.component.scss'],
    imports: [UiButtonComponent, MatGridListModule],
    standalone: true,
})
export class UiShowcasePageComponent {
    // just a demo handler for the button click event
    handleButtonClick() {
        alert('Button clicked!');
    }
}
