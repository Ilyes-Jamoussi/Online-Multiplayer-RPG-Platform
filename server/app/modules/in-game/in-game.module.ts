import { Game, gameSchema } from '@app/modules/game-store/entities/game.entity';
import { InGameController } from '@app/modules/in-game/controllers/in-game.controller';
import { CombatGateway } from '@app/modules/in-game/gateways/combat/combat.gateway';
import { InGameGateway } from '@app/modules/in-game/gateways/in-game/in-game.gateway';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { CombatTimerService } from '@app/modules/in-game/services/combat-timer/combat-timer.service';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { InitializationService } from '@app/modules/in-game/services/initialization/initialization.service';
import { MovementService } from '@app/modules/in-game/services/movement/movement.service';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { TurnTimerService } from '@app/modules/in-game/services/turn-timer/turn-timer.service';
import { VirtualPlayerService } from '@app/modules/in-game/services/virtual-player/virtual-player.service';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    controllers: [InGameController],
    providers: [
        InGameService,
        InGameGateway,
        CombatGateway,
        TimerService,
        TurnTimerService,
        CombatTimerService,
        GameCacheService,
        GameplayService,
        InitializationService,
        InGameSessionRepository,
        MovementService,
        ActionService,
        CombatService,
        VirtualPlayerService,
    ],
    exports: [InGameService],
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]), EventEmitterModule.forRoot()],
})
export class InGameModule {}
