import { ChatMessageDto } from '@app/modules/chat/dto/chat-message.dto';
import { LeaveChatDto } from '@app/modules/chat/dto/leave-chat.dto';
import { SendMessageDto } from '@app/modules/chat/dto/send-message.dto';
import { ChatService } from '@app/modules/chat/services/chat.service';
import { successResponse } from '@app/utils/socket-response/socket-response.util';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';
import { ChatEvents } from '@common/enums/chat-events.enum';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UsePipes(
    new ValidationPipe({
        transform: true,
        exceptionFactory: validationExceptionFactory,
    }),
)
@WebSocketGateway({
    cors: true,
})
@Injectable()
export class ChatGateway {
    @WebSocketServer() private readonly server: Server;

    constructor(private readonly chatService: ChatService) {}

    @SubscribeMessage(ChatEvents.SendMessage)
    sendMessage(socket: Socket, data: SendMessageDto): void {
        const message: ChatMessage = {
            ...data,
            authorId: socket.id,
            timestamp: new Date().toISOString(),
        };

        if (!socket.rooms.has(data.chatId)) {
            void socket.join(data.chatId);
        }

        this.server.to(data.chatId).emit(ChatEvents.MessageReceived, successResponse<ChatMessageDto>(message));
    }

    @SubscribeMessage(ChatEvents.LeaveChatRoom)
    leaveChatRoom(socket: Socket, data: LeaveChatDto): void {
        void socket.leave(data.chatId);
    }
}
