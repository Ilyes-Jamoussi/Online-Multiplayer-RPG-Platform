import { ROUTES } from '@app/enums/routes.enum';

export interface NotificationMessage {
    title: string;
    message: string;
    type: 'error' | 'success' | 'information' | 'confirmation';
    redirectRoute?: (typeof ROUTES)[keyof typeof ROUTES];
    onConfirm?: () => void;
    onCancel?: () => void;
}
