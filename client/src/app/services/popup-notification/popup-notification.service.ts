import { Injectable, Signal, signal } from '@angular/core';
import { NotificationMessage } from '@app/interfaces/notification-message.interface';

@Injectable({
    providedIn: 'root',
})
export class PopupNotificationService {
    private readonly popupNotification = signal<NotificationMessage | null>(null);

    get notification(): Signal<NotificationMessage | null> {
        return this.popupNotification.asReadonly();
    }

    displayError(error: Omit<NotificationMessage, 'type'>): void {
        this.popupNotification.set({ ...error, type: 'error' });
    }

    displaySuccess(success: Omit<NotificationMessage, 'type'>): void {
        this.popupNotification.set({ ...success, type: 'success' });
    }

    displayInformation(information: Omit<NotificationMessage, 'type'>): void {
        this.popupNotification.set({ ...information, type: 'information' });
    }

    reset(): void {
        this.popupNotification.set(null);
    }
}
