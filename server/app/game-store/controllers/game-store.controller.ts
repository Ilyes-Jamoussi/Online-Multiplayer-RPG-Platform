import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateGameDto } from '@app/game-store/dto/create-game.dto';
import { SaveGameDto } from '@app/game-store/dto/save-game.dto';
import { GameInitDto } from '@app/game-store/dto/game-init.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { ToggleVisibilityDto } from '@app/game-store/dto/toggle-visibility.dto';

import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { GameStoreService } from '@app/game-store/services/game-store.service';
import { ReadGameDto } from '@app/game-store/dto/read-game.dto';

@ApiTags('Games')
@Controller('games')
export class GameStoreController {
    constructor(
        private readonly gameService: GameStoreService,
        private readonly gameStoreGateway: GameStoreGateway,
    ) {}

    @Get()
    @ApiOperation({ summary: 'List games (preview)' })
    @ApiResponse({ status: 200, type: [GamePreviewDto] })
    async getGamesPreview(): Promise<GamePreviewDto[]> {
        return this.gameService.getGames();
    }

    @Get(':id/init')
    @ApiOperation({ summary: 'Load game initialization data for the editor / game' })
    @ApiResponse({ status: 200, type: GameInitDto })
    async getGameInit(@Param('id') id: string): Promise<GameInitDto> {
        return this.gameService.getGameInit(id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get game by ID' })
    @ApiResponse({ status: 200, type: ReadGameDto })
    async getGameById(@Param('id') id: string): Promise<ReadGameDto> {
        return this.gameService.getGameById(id);
    }

    @Post()
    @ApiOperation({
        summary: 'Create a game',
        description: 'Accepts a CreateGameDto containing meta/size/mode as well as compressed non-BASE tiles and placed objects.',
    })
    @ApiResponse({ status: 201, type: GamePreviewDto })
    @ApiResponse({ status: 400, description: 'Invalid payload (DTO validation)' })
    @ApiResponse({ status: 409, description: 'Name already used' })
    async createGame(@Body() dto: CreateGameDto): Promise<GamePreviewDto> {
        const gamePreview = await this.gameService.createGame(dto);
        this.gameStoreGateway.emitGameCreated(gamePreview);
        return gamePreview;
    }

    @Patch(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Update a game',
        description: 'Updates meta/tiles/objects according to UpdateGameDto (same compressed format for tiles: only non-BASE).',
    })
    @ApiResponse({ status: 204, description: 'Updated' })
    @ApiResponse({ status: 400, description: 'Invalid payload (DTO validation)' })
    @ApiResponse({ status: 404, description: 'Game not found' })
    async updateGame(@Param('id') id: string, @Body() dto: SaveGameDto): Promise<void> {
        const gamePreview = await this.gameService.updateGame(id, dto);
        this.gameStoreGateway.emitGameUpdated(gamePreview);
    }

    @Patch(':id/visibility')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Toggle game visibility' })
    @ApiResponse({ status: 204, description: 'Visibility updated' })
    @ApiResponse({ status: 404, description: 'Game not found' })
    async toggleVisibility(@Param('id') id: string, @Body() dto: ToggleVisibilityDto): Promise<void> {
        await this.gameService.toggleVisibility(id, dto.visibility);
        this.gameStoreGateway.emitGameVisibilityToggled(id, dto.visibility);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a game' })
    @ApiResponse({ status: 204, description: 'Deleted' })
    @ApiResponse({ status: 404, description: 'Game not found' })
    async deleteGame(@Param('id') id: string): Promise<void> {
        await this.gameService.deleteGame(id);
        this.gameStoreGateway.emitGameDeleted(id);
    }
}
