import { Component, Signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { ChatService } from '@app/services/chat/chat.service';
import { PlayerService } from '@app/services/player/player.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { MAX_CHAT_MESSAGE_LENGTH } from '@common/constants/chat';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [UiButtonComponent, UiInputComponent, CommonModule, FormsModule],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewChecked {
    @ViewChild('messagesContainer') private readonly messagesContainer!: ElementRef;

    messageInput = '';
    private shouldScrollToBottom = false;
    readonly maxMessageLength = MAX_CHAT_MESSAGE_LENGTH;

    constructor(
        private readonly chatService: ChatService,
        private readonly playerService: PlayerService,
    ) {}

    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    get messages(): Signal<ChatMessage[]> {
        const messages = this.chatService.messages;
        this.shouldScrollToBottom = true;
        return messages;
    }

    sendMessage(): void {
        const input = this.messageInput.trim();

        if (input.length === 0 || input.length > MAX_CHAT_MESSAGE_LENGTH) {
            return;
        }

        this.chatService.sendMessage(input);
        this.messageInput = '';
        this.shouldScrollToBottom = true;
    }

    formatTime(timestamp: string): string {
        return new Date(timestamp).toLocaleTimeString('fr-CA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    isMyMessage(authorId: string): boolean {
        return authorId === this.playerService.id();
    }

    private scrollToBottom(): void {
        if (this.messagesContainer) {
            const element = this.messagesContainer.nativeElement;
            element.scrollTop = element.scrollHeight;
        }
    }
}
