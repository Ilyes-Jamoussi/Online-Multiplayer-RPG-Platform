import { InGameModule } from '@app/modules/in-game/in-game.module';
import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './services/chat.service';

@Module({
    imports: [InGameModule],
    providers: [ChatService, ChatGateway],
    exports: [ChatService],
})
export class ChatModule {}
