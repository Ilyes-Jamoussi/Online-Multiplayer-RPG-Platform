import { signal, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { ChatSocketService } from '@app/services/chat-socket/chat-socket.service';
import { PlayerService } from '@app/services/player/player.service';
import { ResetService } from '@app/services/reset/reset.service';
import { SessionService } from '@app/services/session/session.service';
import { ChatService } from './chat.service';

const TEST_CHAT_ID = 'test-chat-id';
const TEST_PLAYER_NAME = 'Test Player';
const TEST_MESSAGE_CONTENT_1 = 'Hello, world!';
const TEST_MESSAGE_CONTENT_2 = 'How are you?';
const TEST_AUTHOR_ID_1 = 'author-id-1';
const TEST_AUTHOR_ID_2 = 'author-id-2';
const TEST_AUTHOR_NAME_1 = 'Author 1';
const TEST_AUTHOR_NAME_2 = 'Author 2';
const TEST_TIMESTAMP_1 = '2024-01-01T00:00:00Z';
const TEST_TIMESTAMP_2 = '2024-01-01T00:01:00Z';
const TEST_MESSAGES_COUNT_ZERO = 0;
const TEST_MESSAGES_COUNT_ONE = 1;
const TEST_MESSAGES_COUNT_TWO = 2;

type MockChatSocketService = {
    sendMessage: jasmine.Spy;
    onMessageReceived: jasmine.Spy;
};

type MockPlayerService = {
    name: Signal<string>;
};

type MockSessionService = {
    chatId: Signal<string>;
};

const CREATE_MOCK_CHAT_MESSAGE = (authorId: string, authorName: string, content: string, timestamp: string): ChatMessage => ({
    authorId,
    authorName,
    content,
    timestamp,
});

describe('ChatService', () => {
    let service: ChatService;
    let mockChatSocketService: MockChatSocketService;
    let mockPlayerService: MockPlayerService;
    let mockSessionService: MockSessionService;
    let resetService: ResetService;
    let playerNameSignal: ReturnType<typeof signal<string>>;
    let chatIdSignal: ReturnType<typeof signal<string>>;
    let messageReceivedCallback: ((data: ChatMessage) => void) | null;

    beforeEach(() => {
        playerNameSignal = signal<string>(TEST_PLAYER_NAME);
        chatIdSignal = signal<string>(TEST_CHAT_ID);
        messageReceivedCallback = null;

        mockChatSocketService = {
            sendMessage: jasmine.createSpy('sendMessage'),
            onMessageReceived: jasmine.createSpy('onMessageReceived').and.callFake((callback: (data: ChatMessage) => void) => {
                messageReceivedCallback = callback;
            }),
        };

        mockPlayerService = {
            name: playerNameSignal.asReadonly(),
        };

        mockSessionService = {
            chatId: chatIdSignal.asReadonly(),
        };

        TestBed.configureTestingModule({
            providers: [
                ChatService,
                ResetService,
                { provide: ChatSocketService, useValue: mockChatSocketService },
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: SessionService, useValue: mockSessionService },
            ],
        });

        service = TestBed.inject(ChatService);
        resetService = TestBed.inject(ResetService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('messages', () => {
        it('should return empty array initially', () => {
            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ZERO);
        });

        it('should return readonly signal', () => {
            const messages = service.messages;
            expect(messages).toBeDefined();
        });
    });

    describe('sendMessage', () => {
        it('should call chatSocketService.sendMessage with correct parameters', () => {
            service.sendMessage(TEST_MESSAGE_CONTENT_1);

            expect(mockChatSocketService.sendMessage).toHaveBeenCalledTimes(1);
            expect(mockChatSocketService.sendMessage).toHaveBeenCalledWith({
                chatId: TEST_CHAT_ID,
                authorName: TEST_PLAYER_NAME,
                content: TEST_MESSAGE_CONTENT_1,
            });
        });

        it('should call chatSocketService.sendMessage with different content', () => {
            service.sendMessage(TEST_MESSAGE_CONTENT_2);

            expect(mockChatSocketService.sendMessage).toHaveBeenCalledTimes(1);
            expect(mockChatSocketService.sendMessage).toHaveBeenCalledWith({
                chatId: TEST_CHAT_ID,
                authorName: TEST_PLAYER_NAME,
                content: TEST_MESSAGE_CONTENT_2,
            });
        });

        it('should use current chatId from sessionService', () => {
            const newChatId = 'new-chat-id';
            chatIdSignal.set(newChatId);

            service.sendMessage(TEST_MESSAGE_CONTENT_1);

            expect(mockChatSocketService.sendMessage).toHaveBeenCalledWith({
                chatId: newChatId,
                authorName: TEST_PLAYER_NAME,
                content: TEST_MESSAGE_CONTENT_1,
            });
        });

        it('should use current player name from playerService', () => {
            const newPlayerName = 'New Player Name';
            playerNameSignal.set(newPlayerName);

            service.sendMessage(TEST_MESSAGE_CONTENT_1);

            expect(mockChatSocketService.sendMessage).toHaveBeenCalledWith({
                chatId: TEST_CHAT_ID,
                authorName: newPlayerName,
                content: TEST_MESSAGE_CONTENT_1,
            });
        });
    });

    describe('reset', () => {
        it('should clear all messages', () => {
            if (messageReceivedCallback) {
                const message = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_1, TEST_AUTHOR_NAME_1, TEST_MESSAGE_CONTENT_1, TEST_TIMESTAMP_1);
                messageReceivedCallback(message);
            }

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ONE);

            service.reset();

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ZERO);
        });

        it('should clear multiple messages', () => {
            if (messageReceivedCallback) {
                const message1 = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_1, TEST_AUTHOR_NAME_1, TEST_MESSAGE_CONTENT_1, TEST_TIMESTAMP_1);
                const message2 = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_2, TEST_AUTHOR_NAME_2, TEST_MESSAGE_CONTENT_2, TEST_TIMESTAMP_2);
                messageReceivedCallback(message1);
                messageReceivedCallback(message2);
            }

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_TWO);

            service.reset();

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ZERO);
        });
    });

    describe('initListeners', () => {
        it('should register message received callback on initialization', () => {
            expect(mockChatSocketService.onMessageReceived).toHaveBeenCalledTimes(1);
        });

        it('should add message to messages when callback is invoked', () => {
            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ZERO);

            if (messageReceivedCallback) {
                const message = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_1, TEST_AUTHOR_NAME_1, TEST_MESSAGE_CONTENT_1, TEST_TIMESTAMP_1);
                messageReceivedCallback(message);
            }

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ONE);
            expect(service.messages()[0]).toEqual({
                authorId: TEST_AUTHOR_ID_1,
                authorName: TEST_AUTHOR_NAME_1,
                content: TEST_MESSAGE_CONTENT_1,
                timestamp: TEST_TIMESTAMP_1,
            });
        });

        it('should add multiple messages when callback is invoked multiple times', () => {
            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ZERO);

            if (messageReceivedCallback) {
                const message1 = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_1, TEST_AUTHOR_NAME_1, TEST_MESSAGE_CONTENT_1, TEST_TIMESTAMP_1);
                const message2 = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_2, TEST_AUTHOR_NAME_2, TEST_MESSAGE_CONTENT_2, TEST_TIMESTAMP_2);
                messageReceivedCallback(message1);
                messageReceivedCallback(message2);
            }

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_TWO);
            expect(service.messages()[0]).toEqual({
                authorId: TEST_AUTHOR_ID_1,
                authorName: TEST_AUTHOR_NAME_1,
                content: TEST_MESSAGE_CONTENT_1,
                timestamp: TEST_TIMESTAMP_1,
            });
            expect(service.messages()[1]).toEqual({
                authorId: TEST_AUTHOR_ID_2,
                authorName: TEST_AUTHOR_NAME_2,
                content: TEST_MESSAGE_CONTENT_2,
                timestamp: TEST_TIMESTAMP_2,
            });
        });

        it('should preserve existing messages when adding new ones', () => {
            if (messageReceivedCallback) {
                const message1 = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_1, TEST_AUTHOR_NAME_1, TEST_MESSAGE_CONTENT_1, TEST_TIMESTAMP_1);
                messageReceivedCallback(message1);
            }

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ONE);

            if (messageReceivedCallback) {
                const message2 = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_2, TEST_AUTHOR_NAME_2, TEST_MESSAGE_CONTENT_2, TEST_TIMESTAMP_2);
                messageReceivedCallback(message2);
            }

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_TWO);
            expect(service.messages()[0].content).toBe(TEST_MESSAGE_CONTENT_1);
            expect(service.messages()[1].content).toBe(TEST_MESSAGE_CONTENT_2);
        });
    });

    describe('ResetService integration', () => {
        it('should reset messages when ResetService triggers reset', () => {
            if (messageReceivedCallback) {
                const message = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_1, TEST_AUTHOR_NAME_1, TEST_MESSAGE_CONTENT_1, TEST_TIMESTAMP_1);
                messageReceivedCallback(message);
            }

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ONE);

            resetService.triggerReset();

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ZERO);
        });

        it('should reset messages multiple times when ResetService triggers reset multiple times', () => {
            if (messageReceivedCallback) {
                const message1 = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_1, TEST_AUTHOR_NAME_1, TEST_MESSAGE_CONTENT_1, TEST_TIMESTAMP_1);
                const message2 = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_2, TEST_AUTHOR_NAME_2, TEST_MESSAGE_CONTENT_2, TEST_TIMESTAMP_2);
                messageReceivedCallback(message1);
                messageReceivedCallback(message2);
            }

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_TWO);

            resetService.triggerReset();

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ZERO);

            if (messageReceivedCallback) {
                const message3 = CREATE_MOCK_CHAT_MESSAGE(TEST_AUTHOR_ID_1, TEST_AUTHOR_NAME_1, TEST_MESSAGE_CONTENT_1, TEST_TIMESTAMP_1);
                messageReceivedCallback(message3);
            }

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ONE);

            resetService.triggerReset();

            expect(service.messages().length).toBe(TEST_MESSAGES_COUNT_ZERO);
        });
    });
});
