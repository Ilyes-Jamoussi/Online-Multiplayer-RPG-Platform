import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationService } from '@app/services/notification/notification.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toast-notification-display.component.html',
    styleUrls: ['./toast-notification-display.component.scss'],
})
export class ToastNotificationDisplayComponent {
    constructor(private readonly notificationCoordinatorService: NotificationService) {}

    get toasts() {
        return this.notificationCoordinatorService.toasts();
    }

    removeToast(id: string): void {
        this.notificationCoordinatorService.removeToast(id);
    }
}
