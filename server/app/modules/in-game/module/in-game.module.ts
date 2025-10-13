import { Game, gameSchema } from '@app/modules/game-store/entities/game.entity';
import { InGameGateway } from '@app/modules/in-game/gateways/in-game.gateway';
import { InGameService, TurnTimerService } from '@app/modules/in-game/services/in-game.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    providers: [InGameService, InGameGateway, TurnTimerService],
    exports: [InGameService],
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }])],
})
export class InGameModule {}
