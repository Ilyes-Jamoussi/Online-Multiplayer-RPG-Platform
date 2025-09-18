import { CreateGameDto } from '@app/game-store/dto/create-game.dto';
import { GameInitDto } from '@app/game-store/dto/game-init.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { UpdateGameDto } from '@app/game-store/dto/update-game.dto';
import { Game, GameDocument } from '@app/game-store/entities/game.entity';
import { ImageService } from '@app/game-store/services/image.service';
import { getProjection } from '@app/utils/mongo.utils';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GameStoreService {
    private readonly logger = new Logger(GameStoreService.name);

    constructor(
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
        private readonly imageService: ImageService,
    ) {}

    async createGame(dto: CreateGameDto): Promise<GamePreviewDto> {
        const gridPreviewUrl = await this.imageService.saveImage(
            dto.gridPreviewImage,
            `${dto.name}-${Date.now()}-preview.png`,
            'grid-previews'
        );

        const gameData = { ...dto, gridPreviewUrl };
        const createdGame = await this.gameModel.create(gameData);

        return this.toGamePreviewDto(createdGame);
    }

    async getGames(): Promise<GamePreviewDto[]> {
        const games = await this.gameModel.find({}, getProjection('displayGameDto')).lean();
        return games.map((game) => this.toGamePreviewDto(game));
    }

    // async getGameById(id: string): Promise<ReadGameDto> {
    //     const game = await this.gameModel.findById(id).lean();
    //     if (!game) {
    //         throw new NotFoundException(`Game with id ${id} not found`);
    //     }

    //     const tiles = game.tiles.map((tile) => ({ ...tile, id: (tile as DbTile)._id.toString() }));
    //     const objects = game.objects.map((obj) => ({ ...obj, id: (obj as DbPlaceable)._id.toString() }));

    //     return {
    //         id: game._id.toString(),
    //         lastModified: game.lastModified,
    //         name: game.name,
    //         description: game.description,
    //         size: game.size,
    //         mode: game.mode,
    //         visibility: game.visibility,
    //         tiles,
    //         objects,
    //     };
    // }

    async getGameInit(gameId: string): Promise<GameInitDto> {
        const game = await this.gameModel.findById(gameId, { map: 1, itemContainers: 1, size: 1 }).lean();
        if (!game) {
            throw new NotFoundException(`Game with id ${gameId} not found`);
        }

        return {
            // map: game.map,
            // itemContainers: game.itemContainers,
            mapSize: game.size,
        };
    }

    async deleteGame(id: string): Promise<void> {
        const game = await this.gameModel.findById(id);
        if (!game) {
            throw new NotFoundException('Game not found');
        }

        if (game.gridPreviewUrl) {
            await this.imageService.deleteImage(game.gridPreviewUrl);
        }

        await this.gameModel.deleteOne({ _id: id });
    }

    async updateGame(id: string, dto: UpdateGameDto): Promise<GamePreviewDto> {
        // Récupérer le jeu existant pour obtenir l'ancienne image
        const existingGame = await this.gameModel.findById(id);
        if (!existingGame) {
            throw new NotFoundException('Game not found');
        }

        // Supprimer l'ancienne image si elle existe
        if (existingGame.gridPreviewUrl) {
            await this.imageService.deleteImage(existingGame.gridPreviewUrl);
        }

        // Sauvegarder la nouvelle image avec timestamp pour forcer la mise à jour
        const gridPreviewUrl = await this.imageService.saveImage(
            dto.gridPreviewImage,
            `${dto.name}-${Date.now()}-preview.png`,
            'grid-previews'
        );

        const updatedGame = await this.gameModel.findByIdAndUpdate(
            id,
            {
                name: dto.name,
                description: dto.description,
                gridPreviewUrl,
                lastModified: new Date(),
            },
            { new: true },
        );

        return this.toGamePreviewDto(updatedGame);
    }

    async toggleVisibility(id: string, newVisibility: boolean): Promise<void> {
        const updated = await this.gameModel
            .findByIdAndUpdate(id, { $set: { visibility: newVisibility, lastModified: new Date() } }, { new: false })
            .lean();

        if (!updated) {
            throw new NotFoundException('Game not found');
        }
    }

    private toGamePreviewDto(game: GameDocument): GamePreviewDto {
        return {
            id: game._id.toString(),
            name: game.name,
            description: game.description,
            size: game.size,
            mode: game.mode,
            lastModified: game.lastModified,
            visibility: game.visibility,
            gridPreviewUrl: game.gridPreviewUrl,
        };
    }
}
