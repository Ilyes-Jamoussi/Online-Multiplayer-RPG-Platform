import { Game, gameSchema } from '@app/modules/game-store/entities/game.entity';
import { CombatGateway } from '@app/modules/in-game/gateways/combat/combat.gateway';
import { InGameGateway } from '@app/modules/in-game/gateways/in-game/in-game.gateway';
import { CombatTimerService } from '@app/modules/in-game/services/combat-timer/combat-timer.service';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameActionService } from '@app/modules/in-game/services/in-game-action/in-game-action.service';
import { InGameInitializationService } from '@app/modules/in-game/services/in-game-initialization/in-game-initialization.service';
import { InGameMovementService } from '@app/modules/in-game/services/in-game-movement/in-game-movement.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    providers: [
        InGameService,
        InGameGateway,
        CombatGateway,
        TimerService,
        CombatTimerService,
        GameCacheService,
        InGameInitializationService,
        InGameSessionRepository,
        InGameMovementService,
        InGameActionService,
        CombatService,
    ],
    exports: [InGameService],
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]), EventEmitterModule.forRoot()],
})
export class InGameModule {}
