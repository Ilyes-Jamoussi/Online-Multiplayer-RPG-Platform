import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { ChatEvents } from '@common/enums/chat-events.enum';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { SendMessageDto } from '@app/dto/send-message-dto';
import { LoadMessagesDto } from '@app/dto/load-messages-dto';

@Injectable({
    providedIn: 'root',
})
export class ChatSocketService {
    constructor(private readonly socketService: SocketService) {}

    sendMessage(data: SendMessageDto): void {
        this.socketService.emit(ChatEvents.SendMessage, data);
    }

    onMessageReceived(callback: (data: ChatMessage) => void): void {
        this.socketService.onSuccessEvent(ChatEvents.MessageReceived, (data: ChatMessage) => {
            callback(data);
        });
    }

    onLoadMessages(callback: (data: LoadMessagesDto) => void): void {
        this.socketService.onSuccessEvent(ChatEvents.LoadMessages, (data: LoadMessagesDto) => {
            callback(data);
        });
    }
}
