import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameStoreController } from '@app/game-store/controllers/game-store.controller';
import { Game, gameSchema } from '@app/game-store/entities/game.entity';
import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { GameStoreService } from '@app/game-store/services/game-store.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }])],
    controllers: [GameStoreController],
    providers: [GameStoreService, GameStoreGateway],
    exports: [GameStoreService],
})
export class GameStoreModule {}
