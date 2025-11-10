import { Injectable, signal, inject } from '@angular/core';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { ChatSocketService } from '@app/services/chat-socket/chat-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerService } from '@app/services/player/player.service';
import { ResetService } from '@app/services/reset/reset.service';

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
        inject(ResetService).reset$.subscribe(() => this.reset());
    }

    sendMessage(content: string): void {
        this.chatSocketService.sendMessage({
            sessionId: this.sessionService.id(),
            authorName: this.playerService.name(),
            content,
        });
    }

    reset(): void {
        this._messages.set([]);
    }

    private initListeners(): void {
        this.chatSocketService.onMessageReceived((data) => {
            this._messages.update((messages) => [...messages, data]);
        });

        this.chatSocketService.onLoadMessages((data) => {
            this._messages.set(data.messages);
        });
    }
}
