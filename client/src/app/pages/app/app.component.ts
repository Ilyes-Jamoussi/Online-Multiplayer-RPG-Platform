import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationDisplayComponent } from '@app/shared/components/notification-display/notification-display.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet, NotificationDisplayComponent],
})
export class AppComponent {}
