import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { NotificationService } from '@app/services/notification/notification.service';

@Component({
    selector: 'app-notification-display',
    standalone: true,
    imports: [NgClass, MatIconModule],
    templateUrl: './notification-display.component.html',
    styleUrls: ['./notification-display.component.scss'],
})
export class NotificationDisplayComponent {
    notification = this.notificationService.notification;

    constructor(
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {}

    onAction(): void {
        const currentNotification = this.notification();
        this.notificationService.reset();

        if (currentNotification?.redirectRoute) {
            void this.router.navigate([currentNotification.redirectRoute]);
        }
    }
}
