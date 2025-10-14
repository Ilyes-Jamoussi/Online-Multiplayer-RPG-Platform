import { InGameModule } from '@app/modules/in-game/module/in-game.module';
import { SessionService } from '@app/modules/session//services/session.service';
import { SessionGateway } from '@app/modules/session/gateways/session.gateway';
import { Module } from '@nestjs/common';
// import { SessionDtoController } from '../controllers/session-dto.controller';

@Module({
    // controllers: [SessionDtoController], pour la genetration des dto ; en commentaire pour le lint
    imports: [InGameModule],
    providers: [SessionService, SessionGateway],
})
export class SessionModule {}
