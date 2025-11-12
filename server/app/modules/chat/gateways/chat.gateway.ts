import { Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatEvents } from '@common/enums/chat-events.enum';
import { ServerEvents } from '@app/enums/server-events.enum';
import { ChatService } from '@app/modules/chat/services/chat.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { SendMessageDto } from '@app/modules/chat/dto/send-message.dto';
import { LoadMessagesDto, ChatMessageDto } from '@app/modules/chat/dto/load-messages.dto';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';
import { successResponse } from '@app/utils/socket-response/socket-response.util';

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

    constructor(
        private readonly chatService: ChatService,
        private readonly inGameSessionRepository: InGameSessionRepository,
    ) {}

    @SubscribeMessage(ChatEvents.SendMessage)
    sendMessage(socket: Socket, data: SendMessageDto): void {
        const message = this.chatService.sendMessage(data, socket.id);
        
        let targetRoom = data.sessionId;
        
        if (data.isGameStarted) {
            try {
                const inGameSession = this.inGameSessionRepository.findById(data.sessionId);
                targetRoom = inGameSession.inGameId;
            } catch {
                targetRoom = data.sessionId;
            }
        }
        
        if (!socket.rooms.has(targetRoom)) {
            void socket.join(targetRoom);
        }
        
        this.server.to(targetRoom).emit(ChatEvents.MessageReceived, successResponse<ChatMessageDto>(message));
    }

    @OnEvent(ServerEvents.LoadMessages)
    loadMessages(sessionId: string, playerId: string): void {
        const messages = this.chatService.getMessages(sessionId);
        if (messages.length > 0) {
            this.server.to(playerId).emit(ChatEvents.LoadMessages, successResponse<LoadMessagesDto>({ messages }));
        }
    }
}
