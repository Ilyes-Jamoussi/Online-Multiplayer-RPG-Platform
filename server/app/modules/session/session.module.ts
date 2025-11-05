import { InGameModule } from '@app/modules/in-game/module/in-game.module';
import { SessionService } from '@app/modules/session//services/session.service';
import { SessionGateway } from '@app/modules/session/gateways/session.gateway';
import { Module } from '@nestjs/common';

@Module({
    imports: [InGameModule],
    providers: [SessionService, SessionGateway],
})
export class SessionModule {}
