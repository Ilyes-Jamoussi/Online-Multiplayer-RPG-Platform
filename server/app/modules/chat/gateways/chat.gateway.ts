import { Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatEvents } from '@common/enums/chat-events.enum';
import { ServerEvents } from '@app/enums/server-events.enum';
import { ChatService } from '../services/chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { LoadMessagesDto, ChatMessageDto } from '../dto/load-messages.dto';
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

    constructor(private readonly chatService: ChatService) {}

    @SubscribeMessage(ChatEvents.SendMessage)
    sendMessage(socket: Socket, data: SendMessageDto): void {
        console.log('ChatGateway.sendMessage received:', data);
        console.log('Socket ID:', socket.id);
        
        // Check if socket is in the session room
        const rooms = Array.from(socket.rooms);
        console.log('Socket rooms:', rooms);
        console.log('Target session:', data.sessionId);
        console.log('Is socket in session room?', socket.rooms.has(data.sessionId));
        
        try {
            const message = this.chatService.sendMessage(data, socket.id);
            console.log('Message created:', message);
            
            // Ensure socket is in the session room for chat
            if (!socket.rooms.has(data.sessionId)) {
                console.log('Socket not in session room, joining...');
                socket.join(data.sessionId);
            }
            
            this.server.to(data.sessionId).emit(ChatEvents.MessageReceived, successResponse<ChatMessageDto>(message));
            console.log('Message emitted to session:', data.sessionId);
            
            // Also check how many sockets are in the room
            const roomSize = this.server.sockets.adapter.rooms.get(data.sessionId)?.size || 0;
            console.log('Room size for session', data.sessionId, ':', roomSize);
        } catch (error) {
            console.error('Error in sendMessage:', error);
        }
    }

    @OnEvent(ServerEvents.LoadMessages)
    loadMessages(sessionId: string, playerId: string): void {
        const messages = this.chatService.getMessages(sessionId);
        if (messages.length > 0) {
            this.server.to(playerId).emit(ChatEvents.LoadMessages, successResponse<LoadMessagesDto>({ messages }));
        }
    }
}
