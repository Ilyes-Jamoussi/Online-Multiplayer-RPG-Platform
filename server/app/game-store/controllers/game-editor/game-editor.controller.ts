import { GameEditorDto } from '@app/game-store/dto/game-editor.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { PatchGameEditorDto } from '@app/game-store/dto/patch-game-editor.dto';
import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { GameEditorService } from '@app/game-store/services/game-editor/game-editor.service';
import { GameStoreService } from '@app/game-store/services/game-store/game-store.service';
import { Body, Controller, Get, NotFoundException, Param, Patch } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Games')
@Controller('games')
export class GameEditorController {
    constructor(
        private readonly gameEditorService: GameEditorService,
        private readonly gameStoreGateway: GameStoreGateway,
        private readonly gameStoreService: GameStoreService,
    ) {}
    @Get(':id/editor')
    @ApiOperation({ summary: 'Load game data for the editor by game ID' })
    @ApiResponse({ status: 200, type: GameEditorDto })
    async getGameForEdit(@Param('id') id: string): Promise<GameEditorDto> {
        return this.gameEditorService.getEditByGameId(id);
    }

    @Patch(':id/editor')
    @ApiOperation({ summary: 'Patch game data from the editor' })
    @ApiBody({ type: PatchGameEditorDto })
    @ApiOkResponse({ type: GameEditorDto })
    async patchGameForEdit(@Param('id') id: string, @Body() body: PatchGameEditorDto): Promise<GamePreviewDto> {
        const dto = await this.gameEditorService.patchEditByGameId(id, body);
        if (!dto) throw new NotFoundException('Game not found');
        this.gameStoreGateway.emitGameUpdated(dto);
        return dto;
    }
}
