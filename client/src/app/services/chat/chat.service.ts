import { Injectable, signal } from '@angular/core';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { ChatSocketService } from '@app/services/chat-socket/chat-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerService } from '@app/services/player/player.service';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private readonly _messages = signal<ChatMessage[]>([]);

    readonly messages = this._messages.asReadonly();

    constructor(
        private readonly chatSocketService: ChatSocketService,
        private readonly sessionService: SessionService,
        private readonly playerService: PlayerService,
    ) {
        this.initListeners();
    }

    sendMessage(content: string): void {
        console.log('ChatService.sendMessage called with:', content);
        console.log('SessionId:', this.sessionService.id(), 'PlayerName:', this.playerService.name());
        this.chatSocketService.sendMessage({
            sessionId: this.sessionService.id(),
            authorName: this.playerService.name(),
            content,
        });
        console.log('Message sent to server');
    }

    reset(): void {
        this._messages.set([]);
    }

    private initListeners(): void {
        this.chatSocketService.onMessageReceived((data) => {
            console.log('Message received:', data);
            this._messages.update((messages) => {
                const newMessages = [...messages, data];
                console.log('Updated messages array:', newMessages);
                return newMessages;
            });
        });

        this.chatSocketService.onLoadMessages((data) => {
            console.log('Load messages received:', data);
            this._messages.set(data.messages);
            console.log('Messages loaded:', data.messages);
        });
    }
}
