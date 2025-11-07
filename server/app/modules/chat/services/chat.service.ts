import { Injectable } from '@nestjs/common';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { SendMessageDto } from '@app/modules/chat/dto/send-message.dto';

@Injectable()
export class ChatService {
    private readonly chatSessions = new Map<string, ChatMessage[]>();

    sendMessage(data: SendMessageDto, authorId: string): ChatMessage {
        const message: ChatMessage = {
            ...data,
            authorId,
            timestamp: new Date().toISOString(),
        };

        if (!this.chatSessions.has(data.sessionId)) {
            this.chatSessions.set(data.sessionId, []);
        }

        const sessionMessages = this.chatSessions.get(data.sessionId);
        if (sessionMessages) {
            sessionMessages.push(message);
        }
        
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
