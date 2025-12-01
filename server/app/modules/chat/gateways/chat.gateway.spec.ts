import { LeaveChatDto } from '@app/modules/chat/dto/leave-chat.dto';
import { SendMessageDto } from '@app/modules/chat/dto/send-message.dto';
import { ChatService } from '@app/modules/chat/services/chat.service';
import { ChatEvents } from '@common/enums/chat-events.enum';
import { Test, TestingModule } from '@nestjs/testing';
import 'reflect-metadata';
import { Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';

const MOCK_CHAT_ID = 'chat-123';
const MOCK_SOCKET_ID = 'socket-123';
const MOCK_AUTHOR_NAME = 'Test Author';
const MOCK_CONTENT = 'Test message content';
const MOCK_TIMESTAMP = '2024-01-01T00:00:00.000Z';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let mockServer: jest.Mocked<Server>;
    let mockSocket: jest.Mocked<Socket>;

    const createMockSocket = (): jest.Mocked<Socket> => {
        const rooms = new Set<string>();
        return {
            id: MOCK_SOCKET_ID,
            rooms,
            join: jest.fn().mockResolvedValue(undefined),
            leave: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<Socket>;
    };

    const createMockServer = (): jest.Mocked<Server> => {
        const mockBroadcastOperator = {
            emit: jest.fn(),
        };
        return {
            to: jest.fn().mockReturnValue(mockBroadcastOperator),
            emit: jest.fn(),
        } as unknown as jest.Mocked<Server>;
    };

    beforeEach(async () => {
        mockServer = createMockServer();
        mockSocket = createMockSocket();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                {
                    provide: ChatService,
                    useValue: {},
                },
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        (gateway as unknown as { server: jest.Mocked<Server> }).server = mockServer;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('sendMessage', () => {
        it('should send message and emit to chat room', () => {
            const sendMessageDto: SendMessageDto = {
                chatId: MOCK_CHAT_ID,
                authorName: MOCK_AUTHOR_NAME,
                content: MOCK_CONTENT,
            };

            const originalDate = Date;
            global.Date = jest.fn(() => ({
                toISOString: jest.fn().mockReturnValue(MOCK_TIMESTAMP),
            })) as unknown as DateConstructor;

            gateway.sendMessage(mockSocket, sendMessageDto);

            expect(mockSocket.join).toHaveBeenCalledWith(MOCK_CHAT_ID);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
            expect(mockServer.to(MOCK_CHAT_ID).emit).toHaveBeenCalledWith(
                ChatEvents.MessageReceived,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        authorId: MOCK_SOCKET_ID,
                        authorName: MOCK_AUTHOR_NAME,
                        content: MOCK_CONTENT,
                        timestamp: MOCK_TIMESTAMP,
                    }),
                }),
            );

            global.Date = originalDate;
        });

        it('should join room if not already in room', () => {
            const sendMessageDto: SendMessageDto = {
                chatId: MOCK_CHAT_ID,
                authorName: MOCK_AUTHOR_NAME,
                content: MOCK_CONTENT,
            };

            mockSocket.rooms.has = jest.fn().mockReturnValue(false);

            gateway.sendMessage(mockSocket, sendMessageDto);

            expect(mockSocket.join).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });

        it('should not join room if already in room', () => {
            const sendMessageDto: SendMessageDto = {
                chatId: MOCK_CHAT_ID,
                authorName: MOCK_AUTHOR_NAME,
                content: MOCK_CONTENT,
            };

            mockSocket.rooms.has = jest.fn().mockReturnValue(true);

            gateway.sendMessage(mockSocket, sendMessageDto);

            expect(mockSocket.join).not.toHaveBeenCalled();
        });
    });

    describe('leaveChatRoom', () => {
        it('should leave chat room', () => {
            const leaveChatDto: LeaveChatDto = {
                chatId: MOCK_CHAT_ID,
            };

            gateway.leaveChatRoom(mockSocket, leaveChatDto);

            expect(mockSocket.leave).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });
    });
});



