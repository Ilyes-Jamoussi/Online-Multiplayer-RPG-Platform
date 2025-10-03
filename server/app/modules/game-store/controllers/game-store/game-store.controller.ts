import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CreateGameDto } from '@app/modules/game-store/dto/create-game.dto';
import { GamePreviewDto } from '@app/modules/game-store/dto/game-preview.dto';
import { ToggleVisibilityDto } from '@app/modules/game-store/dto/toggle-visibility.dto';
import { GameStoreGateway } from '@app/modules/game-store/gateways/game-store.gateway';
import { GameStoreService } from '@app/modules/game-store/services/game-store/game-store.service';

@ApiTags('Games')
@Controller('games')
export class GameStoreController {
    constructor(
        private readonly gameService: GameStoreService,
        private readonly gameStoreGateway: GameStoreGateway,
    ) {}

    @Get()
    @ApiOkResponse({ type: [GamePreviewDto] })
    async getGamesPreview(): Promise<GamePreviewDto[]> {
        return this.gameService.getGames();
    }

    @Post()
    @ApiCreatedResponse({ type: GamePreviewDto })
    async createGame(@Body() dto: CreateGameDto): Promise<GamePreviewDto> {
        const gamePreview = await this.gameService.createGame(dto);
        return gamePreview;
    }

    @Patch(':id/visibility')
    @HttpCode(HttpStatus.NO_CONTENT)
    async toggleVisibility(@Param('id') id: string, @Body() dto: ToggleVisibilityDto): Promise<void> {
        await this.gameService.toggleVisibility(id, dto.visibility);
        this.gameStoreGateway.emitGameVisibilityToggled(id, dto.visibility);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteGame(@Param('id') id: string): Promise<void> {
        await this.gameService.deleteGame(id);
        this.gameStoreGateway.emitGameDeleted(id);
    }
}
