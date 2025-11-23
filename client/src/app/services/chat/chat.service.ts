import { inject, Injectable, signal } from '@angular/core';
import { ChatSocketService } from '@app/services/chat-socket/chat-socket.service';
import { PlayerService } from '@app/services/player/player.service';
import { ResetService } from '@app/services/reset/reset.service';
import { SessionService } from '@app/services/session/session.service';
import { ChatMessage } from '@common/interfaces/chat-message.interface';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private readonly _messages = signal<ChatMessage[]>([]);

    readonly messages = this._messages.asReadonly();

    constructor(
        private readonly chatSocketService: ChatSocketService,
        private readonly playerService: PlayerService,
        private readonly sessionService: SessionService,
    ) {
        this.initListeners();
        inject(ResetService).reset$.subscribe(() => this.reset());
    }

    sendMessage(content: string): void {
        this.chatSocketService.sendMessage({
            chatId: this.sessionService.chatId(),
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
    }
}
