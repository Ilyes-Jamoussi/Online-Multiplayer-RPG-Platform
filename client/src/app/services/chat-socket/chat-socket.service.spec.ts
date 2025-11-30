import { TestBed } from '@angular/core/testing';
import { LeaveChatDto } from '@app/dto/leave-chat-dto';
import { SendMessageDto } from '@app/dto/send-message-dto';
import { SocketService } from '@app/services/socket/socket.service';
import { ChatEvents } from '@common/enums/chat-events.enum';
import { ChatMessage } from '@common/interfaces/chat-message.interface';
import { ChatSocketService } from './chat-socket.service';

const TEST_CHAT_ID = 'test-chat-id';
const TEST_AUTHOR_NAME = 'Test Author';
const TEST_MESSAGE_CONTENT = 'Test message content';
const TEST_AUTHOR_ID = 'test-author-id';
const TEST_TIMESTAMP = '2024-01-01T00:00:00Z';

type MockSocketService = {
    emit: jasmine.Spy;
    onSuccessEvent: jasmine.Spy;
};

const createMockChatMessage = (): ChatMessage => ({
    authorId: TEST_AUTHOR_ID,
    authorName: TEST_AUTHOR_NAME,
    content: TEST_MESSAGE_CONTENT,
    timestamp: TEST_TIMESTAMP,
});

const createMockSendMessageDto = (): SendMessageDto => ({
    chatId: TEST_CHAT_ID,
    authorName: TEST_AUTHOR_NAME,
    content: TEST_MESSAGE_CONTENT,
});

const createMockLeaveChatDto = (): LeaveChatDto => ({
    chatId: TEST_CHAT_ID,
});

describe('ChatSocketService', () => {
    let service: ChatSocketService;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = {
            emit: jasmine.createSpy('emit'),
            onSuccessEvent: jasmine.createSpy('onSuccessEvent'),
        };

        TestBed.configureTestingModule({
            providers: [ChatSocketService, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(ChatSocketService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('sendMessage', () => {
        it('should call socketService.emit with SendMessage event and data', () => {
            const data = createMockSendMessageDto();

            service.sendMessage(data);

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(ChatEvents.SendMessage, data);
        });

        it('should call socketService.emit with different SendMessage data', () => {
            const differentData: SendMessageDto = {
                chatId: 'different-chat-id',
                authorName: 'Different Author',
                content: 'Different content',
            };

            service.sendMessage(differentData);

            expect(mockSocketService.emit).toHaveBeenCalledWith(ChatEvents.SendMessage, differentData);
        });
    });

    describe('onMessageReceived', () => {
        it('should call socketService.onSuccessEvent with MessageReceived event', () => {
            const callback = jasmine.createSpy('callback');

            service.onMessageReceived(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(ChatEvents.MessageReceived, jasmine.any(Function));
        });

        it('should invoke callback with message data when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: ChatMessage) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: ChatEvents, cb: (data: ChatMessage) => void) => {
                eventCallback = cb;
            });

            service.onMessageReceived(callback);

            const message = createMockChatMessage();
            if (eventCallback) {
                eventCallback(message);
            }

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(message);
        });

        it('should invoke callback with different message data', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: ChatMessage) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: ChatEvents, cb: (data: ChatMessage) => void) => {
                eventCallback = cb;
            });

            service.onMessageReceived(callback);

            const differentMessage: ChatMessage = {
                authorId: 'different-author-id',
                authorName: 'Different Author',
                content: 'Different content',
                timestamp: '2024-01-02T00:00:00Z',
            };

            if (eventCallback) {
                eventCallback(differentMessage);
            }

            expect(callback).toHaveBeenCalledWith(differentMessage);
        });
    });

    describe('leaveChatRoom', () => {
        it('should call socketService.emit with LeaveChatRoom event and data', () => {
            const data = createMockLeaveChatDto();

            service.leaveChatRoom(data);

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(ChatEvents.LeaveChatRoom, data);
        });

        it('should call socketService.emit with different LeaveChatRoom data', () => {
            const differentData: LeaveChatDto = {
                chatId: 'different-chat-id',
            };

            service.leaveChatRoom(differentData);

            expect(mockSocketService.emit).toHaveBeenCalledWith(ChatEvents.LeaveChatRoom, differentData);
        });
    });
});

