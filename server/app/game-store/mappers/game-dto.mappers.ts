// src/game/mappers/game-dto.mapper.ts
import { Injectable } from '@nestjs/common';
import { GameDocument } from '@app/game-store/entities/game.entity';
import { GameEditorDto } from '@app/game-store/dto/game-editor.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { GameEditorTileDto } from '@app/game-store/dto/game-editor-tile.dto';
import { GameEditorPlaceableDto } from '@app/game-store/dto/game-editor-placeable.dto';

@Injectable()
export class GameDtoMapper {
    toGameEditorDto(game: GameDocument): GameEditorDto {
        return {
            id: game._id.toString(),
            name: game.name,
            description: game.description ?? '',
            size: game.size,
            mode: game.mode,
            tiles: game.tiles.map((t) => ({
                x: t.x,
                y: t.y,
                kind: t.kind,
            })) as GameEditorTileDto[],
            objects: game.objects.map((o) => ({
                x: o.x,
                y: o.y,
                kind: o.kind,
                placed: o.placed,
            })) as GameEditorPlaceableDto[],
            gridPreviewUrl: game.gridPreviewUrl,
            lastModified: game.lastModified,
        };
    }

    toGamePreviewDto(game: GameDocument): GamePreviewDto {
        return {
            id: game._id.toString(),
            name: game.name,
            size: game.size,
            mode: game.mode,
            description: game.description ?? '',
            lastModified: game.lastModified,
            visibility: game.visibility,
            gridPreviewUrl: game.gridPreviewUrl,
            draft: game.draft,
        };
    }
}
