import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateGameDto } from '@app/game-store/dto/create-game.dto';
import { GameInitDto } from '@app/game-store/dto/game-init.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { ToggleVisibilityDto } from '@app/game-store/dto/toggle-visibility.dto';
import { UpdateGameDto } from '@app/game-store/dto/update-game.dto';
import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { GameStoreService } from '@app/game-store/services/game-store/game-store.service';
import { ImageService } from '@app/game-store/services/image/image.service';

@ApiTags('Games')
@Controller('games')
export class GameStoreController {
    constructor(
        private readonly gameService: GameStoreService,
        private readonly gameStoreGateway: GameStoreGateway,
        private readonly imageService: ImageService,
    ) {}

    @Get()
    async getGamesPreview(): Promise<GamePreviewDto[]> {
        return this.gameService.getGames();
    }

    @Get(':id/init')
    async getGameInit(@Param('id') id: string): Promise<GameInitDto> {
        return this.gameService.getGameInit(id);
    }

    @Post()
    async createGame(@Body() dto: CreateGameDto): Promise<GamePreviewDto> {
        const gamePreview = await this.gameService.createGame(dto);
        return gamePreview;
    }

    @Patch(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateGame(@Param('id') id: string, @Body() dto: UpdateGameDto): Promise<void> {
        const gamePreview = await this.gameService.updateGame(id, dto);
        this.gameStoreGateway.emitGameUpdated(gamePreview);
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
