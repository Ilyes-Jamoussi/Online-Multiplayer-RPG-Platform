import { GameCacheService } from './game-cache.service';
import { Game, GameDocument } from '@app/modules/game-store/entities/game.entity';
import { Model, Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';

describe('GameCacheService', () => {
    let service: GameCacheService;
    const mockModel: Record<string, unknown> = {};

    const mockSessionId = 'session-123';
    const mockGameId = new Types.ObjectId().toString();
    const mockObjectId = new Types.ObjectId();

    const createMockGame = (overrides: Partial<Game> = {}): Game => ({
        _id: mockObjectId,
        name: 'Test Game',
        description: 'Test Description',
        size: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        tiles: [],
        objects: [],
        visibility: true,
        lastModified: new Date(),
        createdAt: new Date(),
        gridPreviewUrl: '',
        draft: false,
        ...overrides,
    });

    beforeEach(() => {
        Object.keys(mockModel).forEach((k) => delete mockModel[k]);
        service = new GameCacheService(mockModel as unknown as Model<GameDocument>);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('fetchAndCacheGame', () => {
        it('should fetch game from database and cache it', async () => {
            const mockGame = createMockGame();
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            const result = await service.fetchAndCacheGame(mockSessionId, mockGameId);

            expect(mockModel.findById).toHaveBeenCalledWith(mockGameId);
            expect(result).toEqual(mockGame);
        });

        it('should cache the fetched game', async () => {
            const mockGame = createMockGame();
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const cachedGame = service.getGameForSession(mockSessionId);
            expect(cachedGame).toEqual(mockGame);
        });

        it('should throw NotFoundException when game is not found', async () => {
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(service.fetchAndCacheGame(mockSessionId, mockGameId)).rejects.toThrow(NotFoundException);
            await expect(service.fetchAndCacheGame(mockSessionId, mockGameId)).rejects.toThrow('Game not found');
        });

        it('should not cache when game is not found', async () => {
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(service.fetchAndCacheGame(mockSessionId, mockGameId)).rejects.toThrow(NotFoundException);

            expect(() => service.getGameForSession(mockSessionId)).toThrow(NotFoundException);
        });

        it('should override existing cached game when called multiple times', async () => {
            const mockGame1 = createMockGame({ name: 'Game 1' });
            const mockGame2 = createMockGame({ name: 'Game 2' });

            mockModel.findById = jest
                .fn()
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame1) })
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame2) });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);
            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const cachedGame = service.getGameForSession(mockSessionId);
            expect(cachedGame.name).toBe('Game 2');
        });

        it('should cache games for different sessions independently', async () => {
            const mockGame1 = createMockGame({ name: 'Game 1' });
            const mockGame2 = createMockGame({ name: 'Game 2' });

            mockModel.findById = jest
                .fn()
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame1) })
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame2) });

            await service.fetchAndCacheGame('session-1', 'game-1');
            await service.fetchAndCacheGame('session-2', 'game-2');

            expect(service.getGameForSession('session-1').name).toBe('Game 1');
            expect(service.getGameForSession('session-2').name).toBe('Game 2');
        });
    });

    describe('getGameForSession', () => {
        it('should return cached game for a session', async () => {
            const mockGame = createMockGame();
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getGameForSession(mockSessionId);

            expect(result).toEqual(mockGame);
        });

        it('should throw NotFoundException when session has no cached game', () => {
            expect(() => service.getGameForSession('non-existent-session')).toThrow(NotFoundException);
            expect(() => service.getGameForSession('non-existent-session')).toThrow('Game not found');
        });

        it('should throw NotFoundException after cache is cleared', async () => {
            const mockGame = createMockGame();
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);
            service.clearGameCache(mockSessionId);

            expect(() => service.getGameForSession(mockSessionId)).toThrow(NotFoundException);
        });

        it('should return correct game when multiple sessions are cached', async () => {
            const mockGame1 = createMockGame({ name: 'Game 1' });
            const mockGame2 = createMockGame({ name: 'Game 2' });
            const mockGame3 = createMockGame({ name: 'Game 3' });

            mockModel.findById = jest
                .fn()
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame1) })
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame2) })
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame3) });

            await service.fetchAndCacheGame('session-1', 'game-1');
            await service.fetchAndCacheGame('session-2', 'game-2');
            await service.fetchAndCacheGame('session-3', 'game-3');

            expect(service.getGameForSession('session-2').name).toBe('Game 2');
        });
    });

    describe('clearGameCache', () => {
        it('should clear cached game for a session', async () => {
            const mockGame = createMockGame();
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            expect(() => service.getGameForSession(mockSessionId)).not.toThrow();

            service.clearGameCache(mockSessionId);

            expect(() => service.getGameForSession(mockSessionId)).toThrow(NotFoundException);
        });

        it('should not throw when clearing non-existent session', () => {
            expect(() => service.clearGameCache('non-existent-session')).not.toThrow();
        });

        it('should only clear cache for specified session', async () => {
            const mockGame1 = createMockGame({ name: 'Game 1' });
            const mockGame2 = createMockGame({ name: 'Game 2' });

            mockModel.findById = jest
                .fn()
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame1) })
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame2) });

            await service.fetchAndCacheGame('session-1', 'game-1');
            await service.fetchAndCacheGame('session-2', 'game-2');

            service.clearGameCache('session-1');

            expect(() => service.getGameForSession('session-1')).toThrow(NotFoundException);
            expect(() => service.getGameForSession('session-2')).not.toThrow();
            expect(service.getGameForSession('session-2').name).toBe('Game 2');
        });

        it('should handle clearing cache multiple times', async () => {
            const mockGame = createMockGame();
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            service.clearGameCache(mockSessionId);
            service.clearGameCache(mockSessionId);

            expect(() => service.getGameForSession(mockSessionId)).toThrow(NotFoundException);
        });

        it('should allow re-caching after clearing', async () => {
            const mockGame1 = createMockGame({ name: 'Game 1' });
            const mockGame2 = createMockGame({ name: 'Game 2' });

            mockModel.findById = jest
                .fn()
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame1) })
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame2) });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);
            service.clearGameCache(mockSessionId);
            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const cachedGame = service.getGameForSession(mockSessionId);
            expect(cachedGame.name).toBe('Game 2');
        });
    });

    describe('integration', () => {
        it('should handle complete lifecycle', async () => {
            const mockGame = createMockGame();
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            const fetchedGame = await service.fetchAndCacheGame(mockSessionId, mockGameId);
            expect(fetchedGame).toEqual(mockGame);

            const cachedGame = service.getGameForSession(mockSessionId);
            expect(cachedGame).toEqual(mockGame);

            service.clearGameCache(mockSessionId);

            expect(() => service.getGameForSession(mockSessionId)).toThrow(NotFoundException);
        });

        it('should handle multiple sessions independently', async () => {
            const mockGame1 = createMockGame({ name: 'Game 1' });
            const mockGame2 = createMockGame({ name: 'Game 2' });

            mockModel.findById = jest
                .fn()
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame1) })
                .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(mockGame2) });

            await service.fetchAndCacheGame('session-1', 'game-1');
            await service.fetchAndCacheGame('session-2', 'game-2');

            expect(service.getGameForSession('session-1').name).toBe('Game 1');
            expect(service.getGameForSession('session-2').name).toBe('Game 2');

            service.clearGameCache('session-1');

            expect(() => service.getGameForSession('session-1')).toThrow(NotFoundException);
            expect(service.getGameForSession('session-2').name).toBe('Game 2');

            service.clearGameCache('session-2');

            expect(() => service.getGameForSession('session-2')).toThrow(NotFoundException);
        });
    });
});
