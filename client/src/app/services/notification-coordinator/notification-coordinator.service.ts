import { Injectable, signal } from '@angular/core';
import { NotificationMessage } from '@app/interfaces/notification-message.interface';
import { DEFAULT_NOTIFICATION_DURATION_MS } from '@app/constants/notification.constants';
import { Toast } from '@app/interfaces/toast.interface';
import { ToastType } from '@app/types/notifications.types';

@Injectable({
    providedIn: 'root',
})
export class NotificationCoordinatorService {
    private readonly _popupNotification = signal<NotificationMessage | null>(null);
    private readonly _toastNotifications = signal<Toast[]>([]);
    private toastIdCounter = 0;

    readonly notification = this._popupNotification.asReadonly();
    readonly toasts = this._toastNotifications.asReadonly();

    displayErrorPopup(error: Omit<NotificationMessage, 'type'>): void {
        this._popupNotification.set({ ...error, type: 'error' });
    }

    displaySuccessPopup(success: Omit<NotificationMessage, 'type'>): void {
        this._popupNotification.set({ ...success, type: 'success' });
    }

    displayInformationPopup(information: Omit<NotificationMessage, 'type'>): void {
        this._popupNotification.set({ ...information, type: 'information' });
    }

    resetPopup(): void {
        this._popupNotification.set(null);
    }

    showToast(message: string, type: ToastType = 'info', duration = DEFAULT_NOTIFICATION_DURATION_MS): void {
        const id = `toast-${this.toastIdCounter++}`;
        const toast: Toast = { id, message, type, duration };

        this._toastNotifications.update((toasts) => [...toasts, toast]);

        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(id);
            }, duration);
        }
    }

    showInfoToast(message: string, duration?: number): void {
        this.showToast(message, 'info', duration);
    }

    showSuccessToast(message: string, duration?: number): void {
        this.showToast(message, 'success', duration);
    }

    removeToast(id: string): void {
        this._toastNotifications.update((toasts) => toasts.filter((toast) => toast.id !== id));
    }
}
