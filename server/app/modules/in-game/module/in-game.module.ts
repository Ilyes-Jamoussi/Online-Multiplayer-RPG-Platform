import { Game, gameSchema } from '@app/modules/game-store/entities/game.entity';
import { InGameGateway } from '@app/modules/in-game/gateways/in-game.gateway';
import { InGameService } from '@app/modules/in-game/services/in-game.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TurnEngineService } from '@app/modules/in-game/services/turn-engine.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
    providers: [InGameService, InGameGateway, TurnEngineService, InGameService],
    exports: [InGameService],
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]), EventEmitterModule.forRoot()],
})
export class InGameModule {}
