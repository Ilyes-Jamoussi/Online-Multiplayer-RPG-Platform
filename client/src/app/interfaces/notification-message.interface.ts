import { ROUTES } from '@app/enums/routes.enum';

export interface NotificationMessage {
    title: string;
    message: string;
    type: 'error' | 'success' | 'information';
    redirectRoute?: (typeof ROUTES)[keyof typeof ROUTES];
}
