import { GameStoreController } from '@app/modules/game-store/controllers/game-store/game-store.controller';
import { CreateGameDto } from '@app/modules/game-store/dto/create-game.dto';
import { GamePreviewDto } from '@app/modules/game-store/dto/game-preview.dto';
import { ToggleVisibilityDto } from '@app/modules/game-store/dto/toggle-visibility.dto';
import { GameStoreGateway } from '@app/modules/game-store/gateways/game-store.gateway';
import { GameStoreService } from '@app/modules/game-store/services/game-store/game-store.service';
import { ImageService } from '@app/modules/game-store/services/image/image.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Test, TestingModule } from '@nestjs/testing';

describe('GameStoreController', () => {
    let controller: GameStoreController;
    let gameService: jest.Mocked<GameStoreService>;
    let gameStoreGateway: jest.Mocked<GameStoreGateway>;

    const mockGamePreview: GamePreviewDto = {
        id: 'test-id',
        name: 'Test Game',
        description: 'Test Description',
        size: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        lastModified: new Date(),
        visibility: true,
        gridPreviewUrl: 'test-preview-url',
        draft: false,
    };

    const mockCreateGameDto: CreateGameDto = {
        name: 'New Game',
        description: 'New Description',
        size: MapSize.SMALL,
        mode: GameMode.CLASSIC,
        visibility: true,
    };

    const mockToggleVisibilityDto: ToggleVisibilityDto = {
        visibility: false,
    };

    beforeEach(async () => {
        const mockGameService = {
            getGames: jest.fn(),
            createGame: jest.fn(),
            toggleVisibility: jest.fn(),
            deleteGame: jest.fn(),
        };

        const mockGateway = {
            emitGameCreated: jest.fn(),
            emitGameUpdated: jest.fn(),
            emitGameVisibilityToggled: jest.fn(),
            emitGameDeleted: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameStoreController],
            providers: [
                {
                    provide: GameStoreService,
                    useValue: mockGameService,
                },
                {
                    provide: GameStoreGateway,
                    useValue: mockGateway,
                },
                {
                    provide: ImageService,
                    useValue: {
                        saveImage: jest.fn(),
                        deleteImage: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<GameStoreController>(GameStoreController);
        gameService = module.get(GameStoreService);
        gameStoreGateway = module.get(GameStoreGateway);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getGames', () => {
        it('should return array of games', async () => {
            const mockGames = [mockGamePreview];
            gameService.getGames.mockResolvedValue(mockGames);

            const result = await controller.getGamesPreview();

            expect(gameService.getGames).toHaveBeenCalled();
            expect(result).toEqual(mockGames);
        });
    });

    describe('createGame', () => {
        it('should create game and emit event', async () => {
            gameService.createGame.mockResolvedValue(mockGamePreview);

            const result = await controller.createGame(mockCreateGameDto);

            expect(gameService.createGame).toHaveBeenCalledWith(mockCreateGameDto);
            expect(result).toEqual(mockGamePreview); // add this assertion
        });
    });

    describe('toggleVisibility', () => {
        it('should toggle visibility and emit event', async () => {
            const gameId = 'test-id';
            gameService.toggleVisibility.mockResolvedValue();

            await controller.toggleVisibility(gameId, mockToggleVisibilityDto);

            expect(gameService.toggleVisibility).toHaveBeenCalledWith(gameId, mockToggleVisibilityDto.visibility);
            expect(gameStoreGateway.emitGameVisibilityToggled).toHaveBeenCalledWith(gameId, mockToggleVisibilityDto.visibility);
        });
    });

    describe('deleteGame', () => {
        it('should delete game and emit event', async () => {
            const gameId = 'test-id';
            gameService.deleteGame.mockResolvedValue();

            await controller.deleteGame(gameId);

            expect(gameService.deleteGame).toHaveBeenCalledWith(gameId);
            expect(gameStoreGateway.emitGameDeleted).toHaveBeenCalledWith(gameId);
        });
    });
});
