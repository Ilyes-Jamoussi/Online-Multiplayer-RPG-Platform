import { ROUTES } from '@app/constants/routes.constants';

export interface NotificationMessage {
    title: string;
    message: string;
    type: 'error' | 'success' | 'information';
    redirectRoute?: (typeof ROUTES)[keyof typeof ROUTES];
}
