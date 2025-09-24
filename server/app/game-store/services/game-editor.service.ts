import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game, GameDocument } from '@app/game-store/entities/game.entity';
import { ImageService } from './image.service';
import { GameEditorDto } from '@app/game-store/dto/game-editor.dto';
import { PatchGameEditorDto } from '@app/game-store/dto/patch-game-editor.dto';
import { Tile } from '@app/game-store/entities/tile.entity';
import { Placeable } from '@app/game-store/entities/placeable.entity';
import { GameEditorPlaceableDto } from '@app/game-store/dto/game-editor-placeable.dto';

@Injectable()
export class GameEditorService {
    private readonly logger = new Logger(GameEditorService.name);

    constructor(
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
        private readonly imageService: ImageService,
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

    async patchEditByGameId(id: string, body: PatchGameEditorDto): Promise<GameEditorDto | null> {
        const update: GameDocument = {} as GameDocument;

        if (body.name !== undefined) update.name = body.name;
        if (body.description !== undefined) update.description = body.description;
        if (body.size !== undefined) update.size = body.size;
        if (body.mode !== undefined) update.mode = body.mode;
        if (body.gridPreviewUrl !== undefined) update.gridPreviewUrl = body.gridPreviewUrl;

        if (body.tiles !== undefined) {
            update.tiles = body.tiles.map((t) => ({
                kind: t.kind,
                x: t.x,
                y: t.y,
                open: t.open,
                teleportChannel: t.teleportChannel,
            }));
        }

        if (body.objects !== undefined) {
            update.objects = body.objects.map((o) => {
                const mapped: GameEditorPlaceableDto = {
                    id: o.id,
                    kind: o.kind,
                    x: o.x,
                    y: o.y,
                    placed: o.placed,
                    orientation: o.orientation,
                };
                return mapped;
            });
        }

        update.lastModified = new Date();
        update.draft = false;

        const doc = await this.gameModel
            .findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
            .select('name description size mode tiles objects gridPreviewUrl lastModified')
            .lean()
            .exec();

        if (!doc) return null;
        return this.mapToEditorDto(doc);
    }

    private mapToEditorDto(doc: Game): GameEditorDto {
        return {
            id: String(doc._id),
            name: doc.name,
            description: doc.description,
            size: doc.size,
            mode: doc.mode,
            tiles: (doc.tiles ?? []).map((t: Tile) => ({
                kind: t.kind,
                x: t.x,
                y: t.y,
                open: t.open,
                teleportChannel: t.teleportChannel,
            })),
            objects: (doc.objects ?? []).map((o: Placeable) => ({
                id: String(o._id),
                kind: o.kind,
                x: o.x,
                y: o.y,
                placed: !!o.placed,
                orientation: o.orientation,
            })),
            gridPreviewUrl: doc.gridPreviewUrl ?? '',
            lastModified: doc.lastModified,
        };
    }
}
