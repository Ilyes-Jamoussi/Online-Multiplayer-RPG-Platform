import { Injectable } from '@nestjs/common';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class ChatService {
    private readonly chatSessions = new Map<string, ChatMessage[]>();

    sendMessage(data: SendMessageDto, authorId: string): ChatMessage {
        console.log('ChatService.sendMessage called with:', data, 'authorId:', authorId);
        
        const message: ChatMessage = {
            ...data,
            authorId,
            timestamp: new Date().toISOString(),
        };

        if (!this.chatSessions.has(data.sessionId)) {
            console.log('Creating new chat session for:', data.sessionId);
            this.chatSessions.set(data.sessionId, []);
        }

        this.chatSessions.get(data.sessionId)!.push(message);
        console.log('Message added to session. Total messages:', this.chatSessions.get(data.sessionId)!.length);
        
        return message;
    }

    createSessionChat(sessionId: string): void {
        this.chatSessions.set(sessionId, []);
    }

    getMessages(sessionId: string): ChatMessage[] {
        return this.chatSessions.get(sessionId) || [];
    }

    clearSession(sessionId: string): void {
        this.chatSessions.delete(sessionId);
    }
}
