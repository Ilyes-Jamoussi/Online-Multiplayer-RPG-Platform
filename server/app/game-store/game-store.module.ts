import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameStoreController } from './controllers/game-store.controller';
import { Game, gameSchema } from './entities/game.entity';
import { GameStoreGateway } from './gateways/game-store.gateway';
import { GameStoreService } from './services/game-store.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }])],
    controllers: [GameStoreController],
    providers: [GameStoreService, GameStoreGateway],
    exports: [GameStoreService],
})
export class GameStoreModule {}
