import { GameEditorController } from '@app/modules/game-store/controllers/game-editor/game-editor.controller';
import { GameStoreController } from '@app/modules/game-store/controllers/game-store/game-store.controller';
import { Game, gameSchema } from '@app/modules/game-store/entities/game.entity';
import { GameStoreGateway } from '@app/modules/game-store/gateways/game-store.gateway';
import { GameEditorService } from '@app/modules/game-store/services/game-editor/game-editor.service';
import { GameStoreService } from '@app/modules/game-store/services/game-store/game-store.service';
import { ImageService } from '@app/modules/game-store/services/image/image.service';
import { GameDtoMapper } from '@app/modules/game-store/utils/game-dto-mapper/game-dto-mapper.util';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }])],
    controllers: [GameStoreController, GameEditorController],
    providers: [GameStoreService, GameStoreGateway, ImageService, GameEditorService, GameDtoMapper],
    exports: [GameStoreService, GameEditorService],
})
export class GameStoreModule {}
