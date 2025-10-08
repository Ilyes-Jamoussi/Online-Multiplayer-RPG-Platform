import { SessionService } from '@app/modules/session//services/session.service';
import { SessionDtoController } from '@app/modules/session/controllers/session-dto.controller';
import { SessionGateway } from '@app/modules/session/gateways/session.gateway';
import { Module } from '@nestjs/common';

@Module({
    controllers: [SessionDtoController],
    providers: [SessionService, SessionGateway],
})
export class SessionModule {}
