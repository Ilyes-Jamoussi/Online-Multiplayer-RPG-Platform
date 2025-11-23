import { Injectable } from '@nestjs/common';
import { CHAT_ID_MIN_VALUE, CHAT_ID_MAX_VALUE } from '@app/constants/chat.constants';

@Injectable()
export class ChatService {
    private readonly activeChatSessions = new Set<string>();

    createChat(): string {
        const chatId = this.generateUniqueChatId();
        this.activeChatSessions.add(chatId);
        return chatId;
    }

    deleteChat(chatId: string): void {
        this.activeChatSessions.delete(chatId);
    }

    private generateUniqueChatId(): string {
        let chatId: string;
        do {
            chatId = Math.floor(CHAT_ID_MIN_VALUE + Math.random() * (CHAT_ID_MAX_VALUE - CHAT_ID_MIN_VALUE + 1)).toString();
        } while (this.activeChatSessions.has(chatId));
        return chatId;
    }
}
