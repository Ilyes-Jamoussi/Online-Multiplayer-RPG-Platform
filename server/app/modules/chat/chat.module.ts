import { Module } from '@nestjs/common';
import { InGameModule } from '@app/modules/in-game/in-game.module';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatController } from './controllers/chat.controller';

@Module({
    imports: [InGameModule],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
    exports: [ChatService],
})
export class ChatModule {}
