import { Component, Signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { ChatService } from '@app/services/chat/chat.service';
import { PlayerService } from '@app/services/player/player.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { MAX_MESSAGE_LENGTH } from '@app/constants/chat.constants';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [UiButtonComponent, UiInputComponent, CommonModule, FormsModule],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewChecked {
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
    
    messageInput = '';
    private shouldScrollToBottom = false;

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
        console.log('sendMessage called, input:', input, 'length:', input.length);
        
        if (input.length === 0 || input.length > MAX_MESSAGE_LENGTH) {
            console.log('Message rejected - invalid length');
            return;
        }
        
        console.log('Calling chatService.sendMessage with:', input);
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
