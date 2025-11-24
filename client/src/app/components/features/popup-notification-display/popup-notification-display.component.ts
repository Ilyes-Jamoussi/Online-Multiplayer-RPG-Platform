import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { NotificationService } from '@app/services/notification/notification.service';

@Component({
    selector: 'app-notification-display',
    standalone: true,
    imports: [NgClass, MatIconModule],
    templateUrl: './popup-notification-display.component.html',
    styleUrls: ['./popup-notification-display.component.scss'],
})
export class PopupNotificationDisplayComponent {
    notification = this.notificationCoordinatorService.notification;

    constructor(
        private readonly notificationCoordinatorService: NotificationService,
        private readonly router: Router,
    ) {}

    onAction(): void {
        const currentNotification = this.notification();
        this.notificationCoordinatorService.resetPopup();

        if (currentNotification?.redirectRoute) {
            void this.router.navigate([currentNotification.redirectRoute]);
        }
    }
}
