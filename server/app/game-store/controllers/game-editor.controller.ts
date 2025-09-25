import { Controller, Get, Param, Patch, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { GameEditorDto } from '@app/game-store/dto/game-editor.dto';
import { PatchGameEditorDto } from '@app/game-store/dto/patch-game-editor.dto';
import { GameEditorService } from '@app/game-store/services/game-editor.service';
import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';

@ApiTags('Games')
@Controller('games')
export class GameEditorController {
    constructor(
        private readonly gameEditorService: GameEditorService,
        private readonly gameStoreGateway: GameStoreGateway,
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
