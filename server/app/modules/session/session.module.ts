import { ChatModule } from '@app/modules/chat/chat.module';
import { InGameModule } from '@app/modules/in-game/in-game.module';
import { SessionService } from '@app/modules/session//services/session.service';
import { SessionController } from '@app/modules/session/controllers/session.controller';
import { SessionGateway } from '@app/modules/session/gateways/session.gateway';
import { Module } from '@nestjs/common';

@Module({
    imports: [InGameModule, ChatModule],
    controllers: [SessionController],
    providers: [SessionService, SessionGateway],
})
export class SessionModule {}
