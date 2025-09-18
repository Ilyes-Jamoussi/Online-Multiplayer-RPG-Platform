import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { successResponse } from '@app/utils/socket-response/socket-response.util';
import { GameStoreEvents } from '@common/constants/game-store-events';
import { GameMode } from '@common/enums/game-mode.enum';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';

describe('GameStoreGateway', () => {
    let gateway: GameStoreGateway;
    let mockServer: jest.Mocked<Server>;

    beforeEach(async () => {
        mockServer = {
            emit: jest.fn(),
        } as Partial<Server> as jest.Mocked<Server>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [GameStoreGateway],
        }).compile();

        gateway = module.get<GameStoreGateway>(GameStoreGateway);
        gateway['server'] = mockServer;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('emitGameCreated', () => {
        it('should emit GameCreated event with success response', () => {
            const mockDto: GamePreviewDto = {
                id: 'test-id',
                name: 'Test Game',
                description: 'Test Description',
                size: 15,
                mode: GameMode.CLASSIC,
                lastModified: new Date(),
                visibility: true,
                gridPreviewUrl: 'test-preview-url',
            };

            gateway.emitGameCreated(mockDto);

            expect(mockServer.emit).toHaveBeenCalledWith(GameStoreEvents.GameCreated, successResponse(mockDto));
        });
    });

    describe('emitGameUpdated', () => {
        it('should emit GameUpdated event with success response', () => {
            const mockDto: GamePreviewDto = {
                id: 'test-id',
                name: 'Updated Game',
                description: 'Updated Description',
                size: 20,
                mode: GameMode.CTF,
                lastModified: new Date(),
                visibility: false,
                gridPreviewUrl: 'updated-preview-url',
            };

            gateway.emitGameUpdated(mockDto);

            expect(mockServer.emit).toHaveBeenCalledWith(GameStoreEvents.GameUpdated, successResponse(mockDto));
        });
    });

    describe('emitGameDeleted', () => {
        it('should emit GameDeleted event with success response containing id', () => {
            const gameId = 'test-game-id';

            gateway.emitGameDeleted(gameId);

            expect(mockServer.emit).toHaveBeenCalledWith(GameStoreEvents.GameDeleted, successResponse({ id: gameId }));
        });
    });

    describe('emitGameVisibilityToggled', () => {
        it('should emit GameVisibilityToggled event with success response containing id and visibility', () => {
            const gameId = 'test-game-id';
            const visibility = true;

            gateway.emitGameVisibilityToggled(gameId, visibility);

            expect(mockServer.emit).toHaveBeenCalledWith(GameStoreEvents.GameVisibilityToggled, successResponse({ id: gameId, visibility }));
        });

        it('should emit GameVisibilityToggled event with visibility false', () => {
            const gameId = 'test-game-id';
            const visibility = false;

            gateway.emitGameVisibilityToggled(gameId, visibility);

            expect(mockServer.emit).toHaveBeenCalledWith(GameStoreEvents.GameVisibilityToggled, successResponse({ id: gameId, visibility }));
        });
    });
});
