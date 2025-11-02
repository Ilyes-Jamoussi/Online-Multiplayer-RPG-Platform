import { Injectable, signal } from '@angular/core';

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
export class ToastService {
    private readonly _toasts = signal<Toast[]>([]);
    private toastIdCounter = 0;

    readonly toasts = this._toasts.asReadonly();

    show(message: string, type: ToastType = 'info', duration = DEFAULT_DURATION): void {
        const id = `toast-${this.toastIdCounter++}`;
        const toast: Toast = { id, message, type, duration };

        this._toasts.update((toasts) => [...toasts, toast]);

        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
    }

    info(message: string, duration?: number): void {
        this.show(message, 'info', duration);
    }

    success(message: string, duration?: number): void {
        this.show(message, 'success', duration);
    }

    warning(message: string, duration?: number): void {
        this.show(message, 'warning', duration);
    }

    error(message: string, duration?: number): void {
        this.show(message, 'error', duration);
    }

    remove(id: string): void {
        this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
    }

    clear(): void {
        this._toasts.set([]);
    }
}

