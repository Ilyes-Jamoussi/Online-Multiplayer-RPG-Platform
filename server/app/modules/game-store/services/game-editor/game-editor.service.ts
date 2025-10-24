import { NAME_ALREADY_EXISTS } from '@app/constants/error-messages.constants';
import { GameEditorPlaceableDto } from '@app/modules/game-store/dto/game-editor-placeable.dto';
import { GameEditorTileDto } from '@app/modules/game-store/dto/game-editor-tile.dto';
import { GameEditorDto } from '@app/modules/game-store/dto/game-editor.dto';
import { GamePreviewDto } from '@app/modules/game-store/dto/game-preview.dto';
import { PatchGameEditorDto } from '@app/modules/game-store/dto/patch-game-editor.dto';
import { Game, GameDocument } from '@app/modules/game-store/entities/game.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { ImageService } from '@app/modules/game-store/services/image/image.service';
import { GameDtoMapper } from '@app/modules/game-store/utils/game-dto-mapper/game-dto-mapper.util';
import { ConflictException, Injectable } from '@nestjs/common';
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
            ...{ tiles: this.mapTiles(dto.tiles) },
            ...{ objects: this.mapObjects(dto.objects) },
            lastModified: new Date(),
            draft: false,
            visibility: false,
        } as GameDocument;

        const doc = await this.gameModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean().exec();
        return doc ? this.gameDtoMapper.toGamePreviewDto(doc) : null;
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
        return tiles.map((t) => ({
            kind: t.kind,
            x: t.x,
            y: t.y,
            open: t.open,
            teleportChannel: t.teleportChannel,
        }));
    }

    private mapObjects(objects: GameEditorPlaceableDto[]): Placeable[] {
        return objects.map((o) => ({
            id: o.id,
            kind: o.kind,
            x: o.x,
            y: o.y,
            placed: o.placed,
            orientation: o.orientation,
        }));
    }
}
