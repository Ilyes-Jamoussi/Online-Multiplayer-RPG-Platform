import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { ChatEvents } from '@common/enums/chat-events.enum';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { SendMessageDto } from '@app/dto/send-message-dto';
import { LeaveChatDto } from '@app/dto/leave-chat-dto';

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

    leaveChatRoom(data: LeaveChatDto): void {
        this.socketService.emit(ChatEvents.LeaveChatRoom, data);
    }
}
