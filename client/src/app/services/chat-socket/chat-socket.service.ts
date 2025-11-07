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
        console.log('ChatSocketService: Setting up listener for MessageReceived');
        this.socketService.onSuccessEvent(ChatEvents.MessageReceived, (data: ChatMessage) => {
            console.log('ChatSocketService: MessageReceived event received:', data);
            callback(data);
        });
    }

    onLoadMessages(callback: (data: LoadMessagesDto) => void): void {
        console.log('ChatSocketService: Setting up listener for LoadMessages');
        this.socketService.onSuccessEvent(ChatEvents.LoadMessages, (data: LoadMessagesDto) => {
            console.log('ChatSocketService: LoadMessages event received:', data);
            callback(data);
        });
    }
}
