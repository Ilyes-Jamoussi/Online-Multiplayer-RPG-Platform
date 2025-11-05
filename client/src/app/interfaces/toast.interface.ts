import { ToastType } from '@app/types/notifications.types';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}
