import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { NotificationService } from '@app/services/notification/notification.service';

@Component({
    selector: 'app-notification-display',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './notification-display.component.html',
    styleUrls: ['./notification-display.component.scss'],
})
export class NotificationDisplayComponent {
    notification = this.notificationService.notification;

    constructor(
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {}

    goHome(): void {
        this.notificationService.reset();
        this.router.navigate([ROUTES.home]);
    }
}
