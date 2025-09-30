import { GAME_NOT_FOUND } from '@app/constants/error-messages.constants';
import { GameEditorDto } from '@app/game-store/dto/game-editor.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { PatchGameEditorDto } from '@app/game-store/dto/patch-game-editor.dto';
import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { GameEditorService } from '@app/game-store/services/game-editor/game-editor.service';
import { Body, Controller, Get, NotFoundException, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Games')
@Controller('games')
export class GameEditorController {
    constructor(
        private readonly gameEditorService: GameEditorService,
        private readonly gameStoreGateway: GameStoreGateway,
    ) {}
    @Get(':id/editor')
    @ApiOkResponse({ type: GameEditorDto })
    async getGameForEdit(@Param('id') id: string): Promise<GameEditorDto> {
        return this.gameEditorService.getEditByGameId(id);
    }

    @Patch(':id/editor')
    @ApiOkResponse({ type: GamePreviewDto })
    async patchGameForEdit(@Param('id') id: string, @Body() body: PatchGameEditorDto): Promise<GamePreviewDto> {
        const dto = await this.gameEditorService.patchEditByGameId(id, body);
        if (!dto) throw new NotFoundException(GAME_NOT_FOUND);
        this.gameStoreGateway.emitGameUpdated(dto);
        return dto;
    }
}
