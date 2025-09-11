export interface NotificationMessage {
    title: string;
    message: string;
    type: 'error' | 'success' | 'information';
}
