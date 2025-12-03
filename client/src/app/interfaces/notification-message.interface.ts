import { ROUTES } from '@app/enums/routes.enum';
import { NotificationMessageType } from '@app/types/game.types';

export interface NotificationMessage {
    title: string;
    message: string;
    type: NotificationMessageType;
    redirectRoute?: (typeof ROUTES)[keyof typeof ROUTES];
    onConfirm?: () => void;
    onCancel?: () => void;
}
