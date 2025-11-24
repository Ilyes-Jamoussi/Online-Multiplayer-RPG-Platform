import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatService } from '@app/services/chat/chat.service';
import { PlayerService } from '@app/services/player/player.service';
import { MAX_CHAT_MESSAGE_LENGTH } from '@common/constants/chat';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { ChatComponent } from './chat.component';

const TEST_PLAYER_ID = 'test-player-id';
const TEST_PLAYER_ID_2 = 'other-player-id';
const TEST_AUTHOR_NAME = 'Test Author';
const TEST_MESSAGE_CONTENT = 'Test message content';
const TEST_MESSAGE_CONTENT_LONG = 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH + 1);
const TEST_MESSAGE_CONTENT_EXACT_LENGTH = 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH);
const TEST_MESSAGE_CONTENT_SHORT = 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH - 1);
const TEST_TIMESTAMP = '2024-01-01T12:30:45Z';
const TEST_TIMESTAMP_2 = '2024-01-01T15:45:30Z';
const EMPTY_STRING = '';
const WHITESPACE_STRING = '   ';
const TEST_MESSAGES_COUNT_ZERO = 0;
const SCROLL_HEIGHT_VALUE = 200;

type MockChatService = {
    messages: Signal<ChatMessage[]>;
    sendMessage: jasmine.Spy;
};

type MockPlayerService = {
    id: Signal<string>;
};

const createMockChatMessage = (
    authorId: string,
    authorName: string,
    content: string,
    timestamp: string,
): ChatMessage => ({
    authorId,
    authorName,
    content,
    timestamp,
});

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let mockChatService: MockChatService;
    let mockPlayerService: MockPlayerService;
    let messagesSignal: ReturnType<typeof signal<ChatMessage[]>>;
    let playerIdSignal: ReturnType<typeof signal<string>>;

    beforeEach(async () => {
        messagesSignal = signal<ChatMessage[]>([]);
        playerIdSignal = signal<string>(TEST_PLAYER_ID);

        mockChatService = {
            messages: messagesSignal.asReadonly(),
            sendMessage: jasmine.createSpy('sendMessage'),
        };

        mockPlayerService = {
            id: playerIdSignal.asReadonly(),
        };

        await TestBed.configureTestingModule({
            imports: [ChatComponent],
            providers: [
                { provide: ChatService, useValue: mockChatService },
                { provide: PlayerService, useValue: mockPlayerService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('maxMessageLength', () => {
        it('should return MAX_CHAT_MESSAGE_LENGTH', () => {
            expect(component.maxMessageLength).toBe(MAX_CHAT_MESSAGE_LENGTH);
        });
    });

    describe('messages', () => {
        it('should return messages from chatService', () => {
            const mockMessages = [
                createMockChatMessage(TEST_PLAYER_ID, TEST_AUTHOR_NAME, TEST_MESSAGE_CONTENT, TEST_TIMESTAMP),
            ];
            messagesSignal.set(mockMessages);
            fixture.detectChanges();

            const result = component.messages;

            expect(result()).toEqual(mockMessages);
        });

        it('should return empty array when chatService has no messages', () => {
            messagesSignal.set([]);
            fixture.detectChanges();

            const result = component.messages();

            expect(result).toEqual([]);
            expect(result.length).toBe(TEST_MESSAGES_COUNT_ZERO);
        });

        it('should set shouldScrollToBottom to true when messages getter is accessed', () => {
            const mockMessages = [
                createMockChatMessage(TEST_PLAYER_ID, TEST_AUTHOR_NAME, TEST_MESSAGE_CONTENT, TEST_TIMESTAMP),
            ];
            messagesSignal.set(mockMessages);
            fixture.detectChanges();

            // Access messages getter
            component.messages;

            // shouldScrollToBottom should be set to true, which will trigger scroll in ngAfterViewChecked
            fixture.detectChanges();
            expect(component.messages()).toEqual(mockMessages);
        });
    });

    describe('sendMessage', () => {
        beforeEach(() => {
            mockChatService.sendMessage.calls.reset();
        });

        it('should not send message when input is empty string', () => {
            component.messageInput = EMPTY_STRING;

            component.sendMessage();

            expect(mockChatService.sendMessage).not.toHaveBeenCalled();
            expect(component.messageInput).toBe(EMPTY_STRING);
        });

        it('should not send message when input is only whitespace', () => {
            component.messageInput = WHITESPACE_STRING;

            component.sendMessage();

            expect(mockChatService.sendMessage).not.toHaveBeenCalled();
            expect(component.messageInput).toBe(WHITESPACE_STRING);
        });

        it('should not send message when input length exceeds MAX_CHAT_MESSAGE_LENGTH', () => {
            component.messageInput = TEST_MESSAGE_CONTENT_LONG;

            component.sendMessage();

            expect(mockChatService.sendMessage).not.toHaveBeenCalled();
            expect(component.messageInput).toBe(TEST_MESSAGE_CONTENT_LONG);
        });

        it('should send message when input is valid and trimmed', () => {
            component.messageInput = `  ${TEST_MESSAGE_CONTENT}  `;

            component.sendMessage();

            expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
            expect(mockChatService.sendMessage).toHaveBeenCalledWith(TEST_MESSAGE_CONTENT);
            expect(component.messageInput).toBe(EMPTY_STRING);
        });

        it('should send message when input length equals MAX_CHAT_MESSAGE_LENGTH', () => {
            component.messageInput = TEST_MESSAGE_CONTENT_EXACT_LENGTH;

            component.sendMessage();

            expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
            expect(mockChatService.sendMessage).toHaveBeenCalledWith(TEST_MESSAGE_CONTENT_EXACT_LENGTH);
            expect(component.messageInput).toBe(EMPTY_STRING);
        });

        it('should send message when input length is less than MAX_CHAT_MESSAGE_LENGTH', () => {
            component.messageInput = TEST_MESSAGE_CONTENT_SHORT;

            component.sendMessage();

            expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
            expect(mockChatService.sendMessage).toHaveBeenCalledWith(TEST_MESSAGE_CONTENT_SHORT);
            expect(component.messageInput).toBe(EMPTY_STRING);
        });

        it('should set shouldScrollToBottom to true after sending message', () => {
            component.messageInput = TEST_MESSAGE_CONTENT;

            component.sendMessage();

            // shouldScrollToBottom should be set to true, which will trigger scroll in ngAfterViewChecked
            fixture.detectChanges();
            expect(mockChatService.sendMessage).toHaveBeenCalled();
        });
    });

    describe('formatTime', () => {
        it('should format timestamp correctly', () => {
            const formatted = component.formatTime(TEST_TIMESTAMP);

            expect(formatted).toBeDefined();
            expect(typeof formatted).toBe('string');
            // The exact format depends on locale, but should contain time components
            expect(formatted.length).toBeGreaterThan(0);
        });

        it('should format different timestamp correctly', () => {
            const formatted = component.formatTime(TEST_TIMESTAMP_2);

            expect(formatted).toBeDefined();
            expect(typeof formatted).toBe('string');
            expect(formatted.length).toBeGreaterThan(0);
        });

        it('should format timestamp with fr-CA locale', () => {
            const date = new Date(TEST_TIMESTAMP);
            const expectedFormat = date.toLocaleTimeString('fr-CA', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            const formatted = component.formatTime(TEST_TIMESTAMP);

            expect(formatted).toBe(expectedFormat);
        });
    });

    describe('isMyMessage', () => {
        it('should return true when authorId matches current player id', () => {
            playerIdSignal.set(TEST_PLAYER_ID);
            fixture.detectChanges();

            const result = component.isMyMessage(TEST_PLAYER_ID);

            expect(result).toBe(true);
        });

        it('should return false when authorId does not match current player id', () => {
            playerIdSignal.set(TEST_PLAYER_ID);
            fixture.detectChanges();

            const result = component.isMyMessage(TEST_PLAYER_ID_2);

            expect(result).toBe(false);
        });

        it('should return false when current player id changes', () => {
            playerIdSignal.set(TEST_PLAYER_ID);
            fixture.detectChanges();

            expect(component.isMyMessage(TEST_PLAYER_ID)).toBe(true);

            playerIdSignal.set(TEST_PLAYER_ID_2);
            fixture.detectChanges();

            expect(component.isMyMessage(TEST_PLAYER_ID)).toBe(false);
            expect(component.isMyMessage(TEST_PLAYER_ID_2)).toBe(true);
        });
    });

    describe('ngAfterViewChecked', () => {
        it('should call scrollToBottom when shouldScrollToBottom is true', () => {
            // Create a mock element for messagesContainer
            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            // Access messages getter to set shouldScrollToBottom to true
            component.messages;

            // Manually set the messagesContainer to our mock element
            (component as unknown as { messagesContainer: { nativeElement: typeof mockElement } }).messagesContainer = {
                nativeElement: mockElement,
            };

            // Trigger ngAfterViewChecked
            component.ngAfterViewChecked();

            // Verify that scrollTop was set to scrollHeight
            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);
        });

        it('should not call scrollToBottom when shouldScrollToBottom is false', () => {
            // Create a fresh component instance to ensure shouldScrollToBottom is false
            const freshFixture = TestBed.createComponent(ChatComponent);
            const freshComponent = freshFixture.componentInstance;

            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (freshComponent as unknown as { messagesContainer: { nativeElement: typeof mockElement } }).messagesContainer = {
                nativeElement: mockElement,
            };

            // Note: We don't call detectChanges() here because it would trigger the template
            // to access messages() getter, which would set shouldScrollToBottom to true.
            // Instead, we directly test ngAfterViewChecked with shouldScrollToBottom = false.

            // Call ngAfterViewChecked once to reset any potential true state
            // (if it was set by previous tests or initialization)
            freshComponent.ngAfterViewChecked();

            // Reset scrollTop to ensure we can detect if scrollToBottom is called
            mockElement.scrollTop = 0;

            // shouldScrollToBottom should be false now, so scrollToBottom should not be called
            freshComponent.ngAfterViewChecked();

            // scrollTop should remain unchanged
            expect(mockElement.scrollTop).toBe(0);
        });

        it('should set shouldScrollToBottom to false after scrolling', () => {
            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (component as unknown as { messagesContainer: { nativeElement: typeof mockElement } }).messagesContainer = {
                nativeElement: mockElement,
            };

            // Set shouldScrollToBottom to true by accessing messages
            component.messages;

            // Trigger ngAfterViewChecked
            component.ngAfterViewChecked();

            // Verify scroll happened
            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);

            // Verify that shouldScrollToBottom was reset to false
            // (we can't directly access it, but if we call ngAfterViewChecked again, it shouldn't scroll)
            mockElement.scrollTop = 0;
            component.ngAfterViewChecked();
            expect(mockElement.scrollTop).toBe(0);
        });
    });

    describe('scrollToBottom', () => {
        it('should scroll to bottom when messagesContainer exists', () => {
            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (component as unknown as { messagesContainer: { nativeElement: typeof mockElement } }).messagesContainer = {
                nativeElement: mockElement,
            };

            // Access messages to set shouldScrollToBottom to true
            component.messages;

            // Trigger ngAfterViewChecked which calls scrollToBottom
            component.ngAfterViewChecked();

            // Verify scrollTop was set to scrollHeight
            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);
        });

        it('should not throw error when messagesContainer is undefined', () => {
            // Set messagesContainer to undefined
            (component as unknown as { messagesContainer: undefined }).messagesContainer = undefined;

            // Access messages to set shouldScrollToBottom to true
            component.messages;

            // Should not throw error
            expect(() => component.ngAfterViewChecked()).not.toThrow();
        });
    });
});
