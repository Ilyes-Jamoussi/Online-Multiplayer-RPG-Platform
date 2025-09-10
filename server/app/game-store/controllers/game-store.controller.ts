import { CreateGameDto } from '@app/game-store/dto/create-game.dto';
import { GameInitDto } from '@app/game-store/dto/game-init.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { ToggleVisibilityDto } from '@app/game-store/dto/toggle-visibility.dto';
import { UpdateGameDto } from '@app/game-store/dto/update-game.dto';
import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { GameStoreService } from '@app/game-store/services/game-store.service';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Games')
@Controller('games')
export class GameStoreController {
    constructor(
        private readonly gameService: GameStoreService,
        private readonly gameStoreGateway: GameStoreGateway,
    ) {}

    @Get()
    @ApiResponse({ type: [GamePreviewDto] })
    async getGames(): Promise<GamePreviewDto[]> {
        return this.gameService.getGames();
    }

    @Get(':id/init')
    @ApiResponse({ type: GameInitDto })
    async getGameInit(@Param('id') id: string): Promise<GameInitDto> {
        return this.gameService.getGameInit(id);
    }

    @Post()
    async createGame(@Body() dto: CreateGameDto): Promise<void> {
        const gamePreview: GamePreviewDto = await this.gameService.createGame(dto);
        this.gameStoreGateway.emitGameCreated(gamePreview);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id')
    async updateGame(@Param('id') id: string, @Body() dto: UpdateGameDto): Promise<void> {
        const gamePreview: GamePreviewDto = await this.gameService.updateGame(id, dto);
        this.gameStoreGateway.emitGameUpdated(gamePreview);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id/visibility')
    async toggleVisibility(@Param('id') id: string, @Body() dto: ToggleVisibilityDto): Promise<void> {
        await this.gameService.toggleVisibility(id, dto.visibility);
        this.gameStoreGateway.emitGameVisibilityToggled(id, dto.visibility);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async deleteGame(@Param('id') id: string): Promise<void> {
        await this.gameService.deleteGame(id);
        this.gameStoreGateway.emitGameDeleted(id);
    }
}
