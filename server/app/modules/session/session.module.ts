import { InGameModule } from '@app/modules/in-game/in-game.module';
import { ChatModule } from '@app/modules/chat/chat.module';
import { SessionService } from '@app/modules/session//services/session.service';
import { SessionGateway } from '@app/modules/session/gateways/session.gateway';
import { SessionController } from '@app/modules/session/controllers/session.controller';
import { Module } from '@nestjs/common';

@Module({
    imports: [InGameModule, ChatModule],
    controllers: [SessionController],
    providers: [SessionService, SessionGateway],
})
export class SessionModule {}
