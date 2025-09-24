import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameStoreController } from '@app/game-store/controllers/game-store.controller';
import { Game, gameSchema } from '@app/game-store/entities/game.entity';
import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { GameStoreService } from '@app/game-store/services/game-store.service';
import { ImageService } from '@app/game-store/services/image.service';
import { GameEditorController } from '@app/game-store//controllers/game-editor.controller';
import { GameEditorService } from '@app/game-store/services/game-editor.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }])],
    controllers: [GameStoreController, GameEditorController],
    providers: [GameStoreService, GameStoreGateway, ImageService, GameEditorService],
    exports: [GameStoreService, GameEditorService],
})
export class GameStoreModule {}
