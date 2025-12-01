import { CHAT_ID_MAX_VALUE, CHAT_ID_MIN_VALUE } from '@app/constants/chat.constants';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';

const MOCK_CHAT_ID_1 = '123';
const MOCK_CHAT_ID_2 = '456';
const MOCK_RANDOM_VALUE_1 = 0.1;
const MOCK_RANDOM_VALUE_2 = 0.2;
const MOCK_RANDOM_VALUE_3 = 0.3;

describe('ChatService', () => {
    let service: ChatService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ChatService],
        }).compile();

        service = module.get<ChatService>(ChatService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createChat', () => {
        it('should create a chat and return chatId', () => {
            const chatId = service.createChat();
            expect(chatId).toBeDefined();
            expect(typeof chatId).toBe('string');
        });

        it('should generate unique chat IDs', () => {
            const chatId1 = service.createChat();
            const chatId2 = service.createChat();
            expect(chatId1).not.toBe(chatId2);
        });

        it('should generate chat ID within valid range', () => {
            const chatId = service.createChat();
            const chatIdNumber = parseInt(chatId, 10);
            expect(chatIdNumber).toBeGreaterThanOrEqual(CHAT_ID_MIN_VALUE);
            expect(chatIdNumber).toBeLessThanOrEqual(CHAT_ID_MAX_VALUE);
        });
    });

    describe('deleteChat', () => {
        it('should delete a chat', () => {
            const chatId = service.createChat();
            expect(() => service.deleteChat(chatId)).not.toThrow();
        });

        it('should allow deleting non-existent chat', () => {
            expect(() => service.deleteChat(MOCK_CHAT_ID_1)).not.toThrow();
        });
    });

    describe('generateUniqueChatId', () => {
        it('should generate unique IDs when collisions occur', () => {
            const originalRandom = Math.random;
            let callCount = 0;
            Math.random = jest.fn(() => {
                callCount++;
                if (callCount === 1) return MOCK_RANDOM_VALUE_1;
                if (callCount === 2) return MOCK_RANDOM_VALUE_1;
                return MOCK_RANDOM_VALUE_2;
            });

            const chatId1 = service.createChat();
            const chatId2 = service.createChat();

            expect(chatId1).not.toBe(chatId2);

            Math.random = originalRandom;
        });
    });
});



