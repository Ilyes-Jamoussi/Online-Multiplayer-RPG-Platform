import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game, GameDocument } from '@app/game-store/entities/game.entity';
import { ImageService } from './image.service';
import { GameEditorDto } from '@app/game-store/dto/game-editor.dto';
import { PatchGameEditorDto } from '@app/game-store/dto/patch-game-editor.dto';
import { GameDtoMapper } from '@app/game-store/mappers/game-dto.mappers';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';

@Injectable()
export class GameEditorService {
    private readonly logger = new Logger(GameEditorService.name);

    constructor(
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
        private readonly imageService: ImageService,
        private readonly gameDtoMapper: GameDtoMapper,
    ) {}

    async getEditByGameId(gameId: string): Promise<GameEditorDto> {
        const game = await this.gameModel.findById(gameId).lean();
        if (!game) {
            throw new NotFoundException(`Game with id ${gameId} not found`);
        }

        return {
            id: game._id.toString(),
            lastModified: game.lastModified,
            name: game.name,
            description: game.description,
            size: game.size,
            mode: game.mode,
            tiles: game.tiles,
            gridPreviewUrl: game.gridPreviewUrl,
            objects: game.objects.map((obj) => ({ ...obj, id: obj._id.toString() })),
        };
    }

    async patchEditByGameId(id: string, body: PatchGameEditorDto): Promise<GamePreviewDto | null> {
        const update: GameDocument = {} as GameDocument;

        if (body.name) update.name = body.name;
        if (body.description) update.description = body.description;
        if (body.size) update.size = body.size;
        if (body.mode) update.mode = body.mode;

        if (body.gridPreviewUrl) {
            const filename = `game-${id}-preview.png`;
            update.gridPreviewUrl = await this.imageService.saveImage(body.gridPreviewUrl, filename, 'game-previews');
        }

        if (body.tiles) {
            update.tiles = body.tiles.map((t) => ({
                kind: t.kind,
                x: t.x,
                y: t.y,
                open: t.open,
                teleportChannel: t.teleportChannel,
            }));
        }

        if (body.objects) {
            update.objects = body.objects.map((o) => ({
                id: o.id,
                kind: o.kind,
                x: o.x,
                y: o.y,
                placed: o.placed,
                orientation: o.orientation,
            }));
        }

        update.lastModified = new Date();
        update.draft = false;

        const doc = await this.gameModel
            .findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
            .lean()
            .exec();

        if (!doc) return null;
        return this.gameDtoMapper.toGamePreviewDto(doc);
    }
}
