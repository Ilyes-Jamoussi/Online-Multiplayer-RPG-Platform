import { CreateGameDto } from '@app/game-store/dto/create-game.dto';
import { GameInitDto } from '@app/game-store/dto/game-init.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { UpdateGameDto } from '@app/game-store/dto/update-game.dto';
import { Game, GameDocument } from '@app/game-store/entities/game.entity';
import { makeDefaultPlaceables } from '@app/game-store/factory/placeable/placeable.factory';
import { makeDefaultTiles } from '@app/game-store/factory/tile/tile.factory';
import { GameDtoMapper } from '@app/game-store/mappers/game-dto.mappers';
import { ImageService } from '@app/game-store/services/image/image.service';
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
        private readonly gameDtoMapper: GameDtoMapper,
    ) {}

    async createGame(dto: CreateGameDto): Promise<GamePreviewDto> {
        const existingDraft = await this.gameModel.findOne({ draft: true });

        if (existingDraft) {
            return this.updateExistingDraft(existingDraft._id.toString(), dto);
        }

        return this.createNewDraft(dto);
    }

    private async createNewDraft(dto: CreateGameDto): Promise<GamePreviewDto> {
        const defaultObjects = makeDefaultPlaceables(dto.size, dto.mode);
        const defaultTiles = makeDefaultTiles(dto.size);

        const gameDocument: GameDocument = {
            ...dto,
            tiles: defaultTiles,
            objects: defaultObjects,
            visibility: false,
            lastModified: new Date(),
            createdAt: new Date(),
            gridPreviewUrl: '',
            draft: true,
        } as GameDocument;

        const createdGame = await this.gameModel.create(gameDocument);
        return this.gameDtoMapper.toGamePreviewDto(createdGame);
    }

    private async updateExistingDraft(draftId: string, dto: CreateGameDto): Promise<GamePreviewDto> {
        const defaultObjects = makeDefaultPlaceables(dto.size, dto.mode);
        const defaultTiles = makeDefaultTiles(dto.size);

        const updatedDraft = await this.gameModel.findByIdAndUpdate(
            draftId,
            {
                ...dto,
                tiles: defaultTiles,
                objects: defaultObjects,
                lastModified: new Date(),
                gridPreviewUrl: '',
            },
            { new: true },
        );

        return this.gameDtoMapper.toGamePreviewDto(updatedDraft);
    }

    async getGames(): Promise<GamePreviewDto[]> {
        const games = await this.gameModel.find({ draft: false }, getProjection('displayGameDto')).sort({ createdAt: -1 }).lean();
        return games.map((game) => this.gameDtoMapper.toGamePreviewDto(game));
    }

    async getGameInit(gameId: string): Promise<GameInitDto> {
        const game = await this.gameModel.findById(gameId, { map: 1, itemContainers: 1, size: 1 }).lean();
        if (!game) {
            throw new NotFoundException(`Game with id ${gameId} not found`);
        }

        return {
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
        const existingGame = await this.gameModel.findById(id);
        if (!existingGame) {
            throw new NotFoundException('Game not found');
        }

        if (existingGame.gridPreviewUrl) {
            await this.imageService.deleteImage(existingGame.gridPreviewUrl);
        }

        const gridPreviewUrl = await this.imageService.saveImage(dto.gridPreviewImage, `${dto.name}-${Date.now()}-preview.png`, 'grid-previews');

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

        return this.gameDtoMapper.toGamePreviewDto(updatedGame);
    }

    async toggleVisibility(id: string, newVisibility: boolean): Promise<void> {
        const updated = await this.gameModel
            .findByIdAndUpdate(id, { $set: { visibility: newVisibility, lastModified: new Date() } }, { new: false })
            .lean();

        if (!updated) {
            throw new NotFoundException('Game not found');
        }
    }
}
