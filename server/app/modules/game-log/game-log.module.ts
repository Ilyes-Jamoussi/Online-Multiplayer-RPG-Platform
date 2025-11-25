import { Module } from '@nestjs/common';
import { InGameModule } from '@app/modules/in-game/in-game.module';
import { GameLogService } from './services/game-log.service';
import { GameLogGateway } from './gateways/game-log.gateway';

@Module({
    imports: [InGameModule],
    providers: [GameLogService, GameLogGateway],
    exports: [GameLogService],
})
export class GameLogModule {}
