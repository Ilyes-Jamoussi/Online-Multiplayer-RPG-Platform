import { ChatModule } from '@app/modules/chat/chat.module';
import { Game, gameSchema } from '@app/modules/game-store/entities/game.entity';
import { InGameModule } from '@app/modules/in-game/in-game.module';
import { SessionService } from '@app/modules/session//services/session.service';
import { SessionController } from '@app/modules/session/controllers/session.controller';
import { SessionGateway } from '@app/modules/session/gateways/session.gateway';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [InGameModule, ChatModule, MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }])],
    controllers: [SessionController],
    providers: [SessionService, SessionGateway],
})
export class SessionModule {}
