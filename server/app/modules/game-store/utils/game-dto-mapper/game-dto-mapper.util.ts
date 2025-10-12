import { GameEditorDto } from '@app/modules/game-store/dto/game-editor.dto';
import { GamePreviewDto } from '@app/modules/game-store/dto/game-preview.dto';
import { GameDocument } from '@app/modules/game-store/entities/game.entity';
import { DEFAULT_DRAFT_GAME_DESCRIPTION, DEFAULT_DRAFT_GAME_NAME } from '@common/constants/game.constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameDtoMapper {
    toGameEditorDto(game: GameDocument): GameEditorDto {
        return {
            id: game._id.toString(),
            lastModified: game.lastModified,
            name: game.name === DEFAULT_DRAFT_GAME_NAME ? '' : game.name,
            description: game.description === DEFAULT_DRAFT_GAME_DESCRIPTION ? '' : game.description,
            size: game.size,
            mode: game.mode,
            tiles: game.tiles,
            gridPreviewUrl: game.gridPreviewUrl,
            objects: game.objects.map((obj) => {
                const { _id: objectId, ...objWithoutId } = obj;
                return { ...objWithoutId, id: objectId.toString() };
            }),
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
