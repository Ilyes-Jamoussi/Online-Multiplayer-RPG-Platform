import { Game, gameSchema } from '@app/modules/game-store/entities/game.entity';
import { InGameGateway } from '@app/modules/in-game/gateways/in-game.gateway';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameInitializationService } from '@app/modules/in-game/services/in-game-initialization/in-game-initialization.service';
import { InGameMovementService } from '@app/modules/in-game/services/in-game-movement/in-game-movement.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { TurnEngineService } from '@app/modules/in-game/services/turn-engine/turn-engine.service';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

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
