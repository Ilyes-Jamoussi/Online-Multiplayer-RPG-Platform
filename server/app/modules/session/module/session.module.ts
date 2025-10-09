import { SessionService } from '@app/modules/session//services/session.service';
import { SessionGateway } from '@app/modules/session/gateways/session.gateway';
import { Module } from '@nestjs/common';

@Module({
    controllers: [],
    providers: [SessionService, SessionGateway],
})
export class SessionModule {}
