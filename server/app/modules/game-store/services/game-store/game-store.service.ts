import { GAME_NOT_FOUND } from '@app/constants/error-messages.constants';
import { CreateGameDto } from '@app/modules/game-store/dto/create-game.dto';
import { GamePreviewDto } from '@app/modules/game-store/dto/game-preview.dto';
import { Game, GameDocument } from '@app/modules/game-store/entities/game.entity';
import { ImageService } from '@app/modules/game-store/services/image/image.service';
import { GameDtoMapper } from '@app/modules/game-store/utils/game-dto-mapper/game-dto-mapper.util';
import { makeDefaultPlaceables } from '@app/modules/game-store/utils/placeable/placeable.util';
import { makeDefaultTiles } from '@app/modules/game-store/utils/tile/tile.util';
import { getProjection } from '@app/utils/mongo/mongo.util';
import { DEFAULT_DRAFT_GAME_DESCRIPTION, DEFAULT_DRAFT_GAME_NAME } from '@common/constants/game.constants';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GameStoreService {
    constructor(
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
        private readonly imageService: ImageService,
        private readonly gameDtoMapper: GameDtoMapper,
    ) {}

    async getGames(): Promise<GamePreviewDto[]> {
        const games = await this.gameModel.find({ draft: false }, getProjection('displayGameDto')).sort({ createdAt: -1 }).lean();
        return games.map((game) => this.gameDtoMapper.toGamePreviewDto(game));
    }

    async createGame(dto: CreateGameDto): Promise<GamePreviewDto> {
        const existingDraft = await this.gameModel.findOne({ draft: true });

        if (existingDraft) {
            return this.updateDraftGame(existingDraft._id.toString(), dto);
        }

        return this.createDraftGame(dto);
    }

    async deleteGame(id: string): Promise<void> {
        const game = await this.gameModel.findById(id);
        if (!game) {
            throw new NotFoundException(GAME_NOT_FOUND);
        }

        if (game.gridPreviewUrl) {
            await this.imageService.deleteImage(game.gridPreviewUrl);
        }

        await this.gameModel.deleteOne({ _id: id });
    }

    async toggleVisibility(id: string, newVisibility: boolean): Promise<void> {
        const updated = await this.gameModel
            .findByIdAndUpdate(id, { $set: { visibility: newVisibility, lastModified: new Date() } }, { new: false })
            .lean();

        if (!updated) {
            throw new NotFoundException(GAME_NOT_FOUND);
        }
    }

    private async createDraftGame(dto: CreateGameDto): Promise<GamePreviewDto> {
        const defaultObjects = makeDefaultPlaceables(dto.size, dto.mode);
        const defaultTiles = makeDefaultTiles(dto.size);

        const newDraft: GameDocument = {
            ...dto,
            name: dto?.name || DEFAULT_DRAFT_GAME_NAME,
            description: dto?.description || DEFAULT_DRAFT_GAME_DESCRIPTION,
            tiles: defaultTiles,
            objects: defaultObjects,
            visibility: false,
            lastModified: new Date(),
            createdAt: new Date(),
            gridPreviewUrl: '',
            draft: true,
        } as GameDocument;

        const createdGame = await this.gameModel.create(newDraft);
        return this.gameDtoMapper.toGamePreviewDto(createdGame);
    }

    private async updateDraftGame(id: string, dto: CreateGameDto): Promise<GamePreviewDto> {
        const defaultObjects = makeDefaultPlaceables(dto.size, dto.mode);
        const defaultTiles = makeDefaultTiles(dto.size);

        const updatedDraft = await this.gameModel.findByIdAndUpdate(
            id,
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
}
