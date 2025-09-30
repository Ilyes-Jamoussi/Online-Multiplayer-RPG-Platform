import { Injectable, Signal, signal } from '@angular/core';
import { NotificationMessage } from '@app/interfaces/notification-message.interface';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private readonly _notification = signal<NotificationMessage | null>(null);

    get notification(): Signal<NotificationMessage | null> {
        return this._notification.asReadonly();
    }

    displayError(error: Omit<NotificationMessage, 'type'>): void {
        this._notification.set({ ...error, type: 'error' });
    }

    displaySuccess(success: Omit<NotificationMessage, 'type'>): void {
        this._notification.set({ ...success, type: 'success' });
    }

    reset(): void {
        this._notification.set(null);
    }
}
