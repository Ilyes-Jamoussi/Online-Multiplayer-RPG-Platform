import { Module } from '@nestjs/common';
import { SessionGateway } from '../gateways/session.gateway';
import { SessionService } from '../services/session.service';
import { SessionDtoController } from '../controllers/session-dto.controller';

@Module({
    controllers: [SessionDtoController],
    providers: [SessionService, SessionGateway],
})
export class SessionModule {}
