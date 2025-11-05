import { GameStoreGateway } from './game-store.gateway';
import { GameStoreEvents } from '@common/enums/game-store-events.enum';
import { GamePreviewDto } from '@app/modules/game-store/dto/game-preview.dto';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import 'reflect-metadata';

describe('GameStoreGateway', () => {
    let gateway: GameStoreGateway;
    let mockServer: jest.Mocked<Server>;

    const GAME_ID = 'game-123';
    const GAME_NAME = 'Test Game';
    const GAME_DESCRIPTION = 'Test Description';

    const createMockGamePreviewDto = (overrides: Partial<GamePreviewDto> = {}): GamePreviewDto => ({
        id: GAME_ID,
        name: GAME_NAME,
        size: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        description: GAME_DESCRIPTION,
        lastModified: new Date('2024-01-01'),
        gridPreviewUrl: 'https://example.com/preview.png',
        visibility: true,
        draft: false,
        ...overrides,
    });

    const createMockServer = (): jest.Mocked<Server> => {
        return {
            emit: jest.fn(),
        } as unknown as jest.Mocked<Server>;
    };

    beforeEach(async () => {
        mockServer = createMockServer();

        const module: TestingModule = await Test.createTestingModule({
            providers: [GameStoreGateway],
        }).compile();

        gateway = module.get<GameStoreGateway>(GameStoreGateway);
        (gateway as unknown as { server: jest.Mocked<Server> }).server = mockServer;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('emitGameCreated', () => {
        it('should emit GameCreated event with success response', () => {
            const dto = createMockGamePreviewDto();

            gateway.emitGameCreated(dto);

            expect(mockServer.emit).toHaveBeenCalledWith(
                GameStoreEvents.GameCreated,
                expect.objectContaining({
                    success: true,
                    data: dto,
                }),
            );
        });
    });

    describe('emitGameUpdated', () => {
        it('should emit GameUpdated event with success response', () => {
            const dto = createMockGamePreviewDto({ name: 'Updated Game Name' });

            gateway.emitGameUpdated(dto);

            expect(mockServer.emit).toHaveBeenCalledWith(
                GameStoreEvents.GameUpdated,
                expect.objectContaining({
                    success: true,
                    data: dto,
                }),
            );
        });
    });

    describe('emitGameDeleted', () => {
        it('should emit GameDeleted event with success response', () => {
            gateway.emitGameDeleted(GAME_ID);

            expect(mockServer.emit).toHaveBeenCalledWith(
                GameStoreEvents.GameDeleted,
                expect.objectContaining({
                    success: true,
                    data: {
                        id: GAME_ID,
                    },
                }),
            );
        });
    });

    describe('emitGameVisibilityToggled', () => {
        it('should emit GameVisibilityToggled event with success response when visibility is true', () => {
            gateway.emitGameVisibilityToggled(GAME_ID, true);

            expect(mockServer.emit).toHaveBeenCalledWith(
                GameStoreEvents.GameVisibilityToggled,
                expect.objectContaining({
                    success: true,
                    data: {
                        id: GAME_ID,
                        visibility: true,
                    },
                }),
            );
        });

        it('should emit GameVisibilityToggled event with success response when visibility is false', () => {
            gateway.emitGameVisibilityToggled(GAME_ID, false);

            expect(mockServer.emit).toHaveBeenCalledWith(
                GameStoreEvents.GameVisibilityToggled,
                expect.objectContaining({
                    success: true,
                    data: {
                        id: GAME_ID,
                        visibility: false,
                    },
                }),
            );
        });
    });
});
