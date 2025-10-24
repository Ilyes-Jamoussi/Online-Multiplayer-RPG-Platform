import { Game, gameSchema } from '@app/modules/game-store/entities/game.entity';
import { InGameGateway } from '@app/modules/in-game/gateways/in-game.gateway';
import { InGameService } from '@app/modules/in-game/services/in-game.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TurnEngineService } from '@app/modules/in-game/services/turn-engine.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache.service';
import { InGameInitializationService } from '@app/modules/in-game/services/in-game-initialization.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session.repository';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InGameMovementService } from '@app/modules/in-game/services/in-game-movement.service';

@Module({
    providers: [
        InGameService,
        InGameGateway,
        TurnEngineService,
        GameCacheService,
        InGameInitializationService,
        InGameSessionRepository,
        InGameMovementService,
    ],
    exports: [InGameService],
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]), EventEmitterModule.forRoot()],
})
export class InGameModule {}
