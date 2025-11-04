import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PopupNotificationDisplayComponent } from '@app/components/features/popup-notification-display/popup-notification-display.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet, PopupNotificationDisplayComponent],
})
export class AppComponent {}
