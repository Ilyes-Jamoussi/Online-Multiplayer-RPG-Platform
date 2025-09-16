import { CreateGameDto } from '@app/game-store/dto/create-game.dto';
import { GameInitDto } from '@app/game-store/dto/game-init.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { Game, GameDocument } from '@app/game-store/entities/game.entity';
import { getProjection } from '@app/utils/mongo.utils';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SaveGameDto } from '@app/game-store/dto/save-game.dto';
import { ReadGameDto } from '@app/game-store/dto/read-game.dto';
import { Placeable } from '@app/game-store/entities/placeable.entity';
import { Tile } from '@app/game-store/entities/tile.entity';

type DbPlaceable = Placeable & { _id: Types.ObjectId };
type DbTile = Tile & { _id: Types.ObjectId };

@Injectable()
export class GameStoreService {
    constructor(@InjectModel(Game.name) private readonly gameModel: Model<GameDocument>) {}

    async createGame(dto: CreateGameDto): Promise<GamePreviewDto> {
        const createdGame = await this.gameModel.create(dto);
        return this.toGamePreviewDto(createdGame);
    }

    async getGames(): Promise<GamePreviewDto[]> {
        const games = await this.gameModel.find({}, getProjection('displayGameDto')).lean();
        return games.map((game) => this.toGamePreviewDto(game));
    }

    async getGameById(id: string): Promise<ReadGameDto> {
        const game = await this.gameModel.findById(id).lean();
        if (!game) {
            throw new NotFoundException(`Game with id ${id} not found`);
        }

        const tiles = game.tiles.map((tile) => ({ ...tile, id: (tile as DbTile)._id.toString() }));
        const objects = game.objects.map((obj) => ({ ...obj, id: (obj as DbPlaceable)._id.toString() }));

        return {
            id: game._id.toString(),
            lastModified: game.lastModified,
            name: game.name,
            description: game.description,
            size: game.size,
            mode: game.mode,
            visibility: game.visibility,
            tiles,
            objects,
        };
    }

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
        const result = await this.gameModel.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
            throw new NotFoundException('Game not found');
        }
    }

    async updateGame(id: string, dto: SaveGameDto): Promise<GamePreviewDto> {
        const updatedGame = await this.gameModel.findByIdAndUpdate(
            id,
            {
                ...dto,
                lastModified: new Date(),
            },
            { new: true },
        );

        if (!updatedGame) {
            throw new NotFoundException('Game not found');
        }

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
        };
    }
}
