import { Injectable, signal } from '@angular/core';
import { NotificationMessage } from '@app/interfaces/notification-message.interface';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

const DEFAULT_DURATION = 3000;

@Injectable({
    providedIn: 'root',
})
export class NotificationCoordinatorService {
    private readonly _popupNotification = signal<NotificationMessage | null>(null);
    private readonly _toasts = signal<Toast[]>([]);
    private toastIdCounter = 0;

    readonly notification = this._popupNotification.asReadonly();
    readonly toasts = this._toasts.asReadonly();

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

    showToast(message: string, type: ToastType = 'info', duration = DEFAULT_DURATION): void {
        const id = `toast-${this.toastIdCounter++}`;
        const toast: Toast = { id, message, type, duration };

        this._toasts.update((toasts) => [...toasts, toast]);

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

    showWarningToast(message: string, duration?: number): void {
        this.showToast(message, 'warning', duration);
    }

    showErrorToast(message: string, duration?: number): void {
        this.showToast(message, 'error', duration);
    }

    removeToast(id: string): void {
        this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
    }

    removeToasts(): void {
        this._toasts.set([]);
    }

    resetNotifications(): void {
        this.resetPopup();
        this.removeToasts();
    }
}

