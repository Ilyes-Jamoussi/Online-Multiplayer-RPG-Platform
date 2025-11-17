import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { NotificationEvents } from '@common/enums/notification-events.enum';

@Injectable({ providedIn: 'root' })
export class NotificationSocketService {
    constructor(private readonly socket: SocketService) {}

    onErrorMessage(callback: (message: string) => void): void {
        this.socket.onSuccessEvent(NotificationEvents.ErrorMessage, callback);
    }
}
