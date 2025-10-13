import { Game, gameSchema } from '@app/modules/game-store/entities/game.entity';
import { InGameGateway } from '@app/modules/in-game/gateways/in-game.gateway';
import { InGameService } from '@app/modules/in-game/services/in-game.service';
import { TurnTimerService } from '@app/modules/in-game/services/turn-timer.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InGameSessionService } from '@app/modules/in-game/services/in-game-session.service';
import { InGameGridService } from '@app/modules/in-game/services/in-game-grid.service';
import { TurnStateMachineService } from '@app/modules/in-game/services/turn-state-machine.service';

@Module({
    providers: [InGameService, InGameGateway, TurnTimerService, InGameGridService, InGameSessionService, TurnStateMachineService],
    exports: [InGameService],
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }])],
})
export class InGameModule {}
