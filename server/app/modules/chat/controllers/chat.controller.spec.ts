import { LeaveChatDto } from '@app/modules/chat/dto/leave-chat.dto';
import { SendMessageDto } from '@app/modules/chat/dto/send-message.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';

const MOCK_CHAT_ID = 'chat-123';
const MOCK_AUTHOR_NAME = 'Test Author';
const MOCK_CONTENT = 'Test message content';

describe('ChatController', () => {
    let controller: ChatController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ChatController],
        }).compile();

        controller = module.get<ChatController>(ChatController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should handle sendMessage', () => {
        const sendMessageDto: SendMessageDto = {
            chatId: MOCK_CHAT_ID,
            authorName: MOCK_AUTHOR_NAME,
            content: MOCK_CONTENT,
        };
        expect(() => controller.sendMessage(sendMessageDto)).not.toThrow();
    });

    it('should handle leaveChat', () => {
        const leaveChatDto: LeaveChatDto = {
            chatId: MOCK_CHAT_ID,
        };
        expect(() => controller.leaveChat(leaveChatDto)).not.toThrow();
    });
});
