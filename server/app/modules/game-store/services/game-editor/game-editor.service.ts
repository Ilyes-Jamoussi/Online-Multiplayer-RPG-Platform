import { GAME_NOT_FOUND, NAME_ALREADY_EXISTS } from '@app/constants/error-messages.constants';
import { GameEditorPlaceableDto } from '@app/modules/game-store/dto/game-editor-placeable.dto';
import { GameEditorTileDto } from '@app/modules/game-store/dto/game-editor-tile.dto';
import { GameEditorDto } from '@app/modules/game-store/dto/game-editor.dto';
import { GamePreviewDto } from '@app/modules/game-store/dto/game-preview.dto';
import { PatchGameEditorDto } from '@app/modules/game-store/dto/patch-game-editor.dto';
import { TeleportChannelDto } from '@app/modules/game-store/dto/teleport-channel.dto';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { TeleportChannel } from '@app/modules/game-store/entities/teleport-channel.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { ImageService } from '@app/modules/game-store/services/image/image.service';
import { GameDtoMapper } from '@app/modules/game-store/utils/game-dto-mapper/game-dto-mapper.util';
import { GameDocument } from '@app/types/mongoose-documents.types';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GameEditorService {
    constructor(
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
        private readonly imageService: ImageService,
        private readonly gameDtoMapper: GameDtoMapper,
    ) {}

    async getEditByGameId(id: string): Promise<GameEditorDto> {
        const game = await this.gameModel.findById(id).lean();
        if (!game) {
            throw new NotFoundException(GAME_NOT_FOUND);
        }
        return this.gameDtoMapper.toGameEditorDto(game);
    }

    async patchEditByGameId(id: string, dto: PatchGameEditorDto): Promise<GamePreviewDto | null> {
        if (dto.name) {
            const conflicting = await this.gameModel
                .findOne({
                    name: dto.name,
                    _id: { $ne: id },
                })
                .lean()
                .exec();

            if (conflicting) {
                throw new ConflictException(NAME_ALREADY_EXISTS);
            }
        }

        const update: GameDocument = {
            ...this.buildBasicUpdate(dto),
            ...(await this.buildImageUpdate(dto, id)),
            ...{ tiles: dto.tiles ? this.mapTiles(dto.tiles) : undefined },
            ...{ objects: dto.objects ? this.mapObjects(dto.objects) : undefined },
            ...{ teleportChannels: dto.teleportChannels ? this.mapTeleportChannels(dto.teleportChannels) : undefined },
            lastModified: new Date(),
            draft: false,
            visibility: false,
        } as GameDocument;

        const updatedGame = await this.gameModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean().exec();
        return updatedGame ? this.gameDtoMapper.toGamePreviewDto(updatedGame) : null;
    }

    private buildBasicUpdate(dto: PatchGameEditorDto): Partial<GameDocument> {
        return {
            ...{ name: dto.name },
            ...{ description: dto.description },
            ...{ size: dto.size },
            ...{ mode: dto.mode },
        };
    }

    private async buildImageUpdate(dto: PatchGameEditorDto, id: string): Promise<Partial<GameDocument>> {
        if (!dto.gridPreviewUrl) return {};

        const existingGame = await this.gameModel.findById(id).lean();
        if (existingGame.gridPreviewUrl) await this.imageService.deleteImage(existingGame.gridPreviewUrl);

        const filename = `game-${id}-${Date.now()}-preview.png`;
        const gridPreviewUrl = await this.imageService.saveImage(dto.gridPreviewUrl, filename, 'game-previews');
        return { gridPreviewUrl };
    }

    private mapTiles(tiles: GameEditorTileDto[]): Tile[] {
        if (!tiles) return [];
        return tiles.map((tile) => ({
            kind: tile.kind,
            x: tile.x,
            y: tile.y,
            open: tile.open,
            teleportChannel: tile.teleportChannel,
        }));
    }

    private mapObjects(objects: GameEditorPlaceableDto[]): Placeable[] {
        if (!objects) return [];
        return objects.map((object) => ({
            id: object.id,
            kind: object.kind,
            x: object.x,
            y: object.y,
            placed: object.placed,
            orientation: object.orientation,
        }));
    }

    private mapTeleportChannels(teleportChannels: TeleportChannelDto[]): TeleportChannel[] {
        if (!teleportChannels) return [];
        return teleportChannels.map((channel) => ({
            channelNumber: channel.channelNumber,
            tiles: channel.tiles,
        }));
    }
}
