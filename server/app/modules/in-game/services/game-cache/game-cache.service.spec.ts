/* eslint-disable max-lines -- Test file */
import { GameCacheService } from './game-cache.service';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { GameDocument } from '@app/types/mongoose-documents.types';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { Model, Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';

describe('GameCacheService', () => {
    let service: GameCacheService;
    const mockModel: Record<string, unknown> = {};

    const mockSessionId = 'session-123';
    const mockGameId = new Types.ObjectId().toString();
    const mockObjectId = new Types.ObjectId();

    const POS_X_0 = 0;
    const POS_Y_0 = 0;
    const POS_X_1 = 1;
    const POS_Y_1 = 1;
    const POS_X_2 = 2;
    const POS_Y_2 = 2;
    const POS_X_3 = 3;
    const POS_Y_3 = 3;
    const POS_X_4 = 4;
    const POS_FAR_OUT_OF_BOUNDS = 99;
    const NEGATIVE_POS = -1;
    const BASE_HEALTH = 100;
    const BASE_SPEED = 3;
    const BASE_ATTACK = 10;
    const BASE_DEFENSE = 5;
    const NO_BONUS = 0;
    const ACTIONS_REMAINING = 1;
    const NO_COMBAT_STATS = 0;
    const TILE_INDEX_1 = 1;
    const EXPECTED_PLACEABLES_COUNT = 2;
    const EXPECTED_PLACEABLES_COUNT_ONE = 1;

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: 'player-123',
        name: 'Test Player',
        avatar: null,
        isAdmin: false,
        baseHealth: BASE_HEALTH,
        healthBonus: NO_BONUS,
        health: BASE_HEALTH,
        maxHealth: BASE_HEALTH,
        baseSpeed: BASE_SPEED,
        speedBonus: NO_BONUS,
        speed: BASE_SPEED,
        baseAttack: BASE_ATTACK,
        attackBonus: NO_BONUS,
        attack: BASE_ATTACK,
        baseDefense: BASE_DEFENSE,
        defenseBonus: NO_BONUS,
        defense: BASE_DEFENSE,
        attackDice: Dice.D6,
        defenseDice: Dice.D4,
        x: POS_X_0,
        y: POS_Y_0,
        isInGame: true,
        startPointId: '',
        actionsRemaining: ACTIONS_REMAINING,
        combatCount: NO_COMBAT_STATS,
        combatWins: NO_COMBAT_STATS,
        combatLosses: NO_COMBAT_STATS,
        combatDraws: NO_COMBAT_STATS,
        ...overrides,
    });

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
        });
    });

    describe('getTileByPlayerId', () => {
        it('should return tile with matching playerId', async () => {
            const mockGame = createMockGame({
                tiles: [
                    { x: POS_X_0, y: POS_Y_0, kind: TileKind.BASE },
                    { x: POS_X_1, y: POS_Y_1, kind: TileKind.BASE },
                ],
            });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);
            const gameMap = service.getGameMapForSession(mockSessionId);
            gameMap.tiles[TILE_INDEX_1].playerId = 'player-123';

            const result = service.getTileByPlayerId(mockSessionId, 'player-123');

            expect(result).toBeDefined();
            expect(result?.x).toBe(POS_X_1);
            expect(result?.y).toBe(POS_Y_1);
            expect(result?.playerId).toBe('player-123');
        });

        it('should return undefined when no tile matches playerId', async () => {
            const mockGame = createMockGame({
                tiles: [{ x: POS_X_0, y: POS_Y_0, kind: TileKind.BASE }],
            });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getTileByPlayerId(mockSessionId, 'non-existent-player');

            expect(result).toBeUndefined();
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getTileByPlayerId('non-existent-session', 'player-123')).toThrow(NotFoundException);
            expect(() => service.getTileByPlayerId('non-existent-session', 'player-123')).toThrow('Game map not found');
        });
    });

    describe('getGameMapForSession', () => {
        it('should return cached game map for a session', async () => {
            const mockGame = createMockGame({
                tiles: [{ x: POS_X_0, y: POS_Y_0, kind: TileKind.BASE }],
                objects: [],
            });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getGameMapForSession(mockSessionId);

            expect(result).toBeDefined();
            expect(result.tiles).toHaveLength(1);
            expect(result.tiles[0].playerId).toBeNull();
            expect(result.objects).toEqual([]);
            expect(result.size).toBe(MapSize.MEDIUM);
        });

        it('should throw NotFoundException when session has no cached game map', () => {
            expect(() => service.getGameMapForSession('non-existent-session')).toThrow(NotFoundException);
            expect(() => service.getGameMapForSession('non-existent-session')).toThrow('Game map not found');
        });

        it('should initialize tiles with playerId as null', async () => {
            const mockGame = createMockGame({
                tiles: [
                    { x: POS_X_0, y: POS_Y_0, kind: TileKind.BASE },
                    { x: POS_X_1, y: POS_Y_1, kind: TileKind.ICE },
                ],
            });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getGameMapForSession(mockSessionId);

            expect(result.tiles.every((tile) => tile.playerId === null)).toBe(true);
        });
    });

    describe('getTileAtPosition', () => {
        const MAP_SIZE = MapSize.MEDIUM;
        const MAP_SIZE_NUM = 15;

        it('should return tile at specified position', async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getTileAtPosition(mockSessionId, POS_X_2, POS_Y_3);

            expect(result).toBeDefined();
            expect(result?.x).toBe(POS_X_2);
            expect(result?.y).toBe(POS_Y_3);
        });

        it('should return undefined for out of bounds position', async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getTileAtPosition(mockSessionId, MAP_SIZE_NUM, MAP_SIZE_NUM);

            expect(result).toBeUndefined();
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getTileAtPosition('non-existent-session', POS_X_0, POS_Y_0)).toThrow(NotFoundException);
        });

        it('should calculate correct index for different positions', async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE; y++) {
                for (let x = 0; x < MAP_SIZE; x++) {
                    tiles.push({ x, y, kind: y === POS_Y_2 && x === POS_X_3 ? TileKind.ICE : TileKind.BASE });
                }
            }
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getTileAtPosition(mockSessionId, POS_X_3, POS_Y_2);

            expect(result?.kind).toBe(TileKind.ICE);
        });
    });

    describe('getNextPosition', () => {
        const MAP_SIZE = MapSize.MEDIUM;
        const MAP_SIZE_NUM = 15;

        beforeEach(async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
            await service.fetchAndCacheGame(mockSessionId, mockGameId);
        });

        it('should return position north of current position', () => {
            const result = service.getNextPosition(mockSessionId, POS_X_2, POS_Y_3, Orientation.N);

            expect(result.x).toBe(POS_X_2);
            expect(result.y).toBe(POS_Y_2);
        });

        it('should return position east of current position', () => {
            const result = service.getNextPosition(mockSessionId, POS_X_2, POS_Y_3, Orientation.E);

            expect(result.x).toBe(POS_X_3);
            expect(result.y).toBe(POS_Y_3);
        });

        it('should return position south of current position', () => {
            const result = service.getNextPosition(mockSessionId, POS_X_2, POS_Y_3, Orientation.S);

            expect(result.x).toBe(POS_X_2);
            expect(result.y).toBe(POS_X_4);
        });

        it('should return position west of current position', () => {
            const result = service.getNextPosition(mockSessionId, POS_X_2, POS_Y_3, Orientation.W);

            expect(result.x).toBe(POS_X_1);
            expect(result.y).toBe(POS_Y_3);
        });

        it('should throw BadRequestException for invalid current position (negative x)', () => {
            expect(() => service.getNextPosition(mockSessionId, NEGATIVE_POS, POS_Y_0, Orientation.N)).toThrow(BadRequestException);
            expect(() => service.getNextPosition(mockSessionId, NEGATIVE_POS, POS_Y_0, Orientation.N)).toThrow('Invalid position');
        });

        it('should throw BadRequestException for invalid current position (negative y)', () => {
            expect(() => service.getNextPosition(mockSessionId, POS_X_0, NEGATIVE_POS, Orientation.N)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException for invalid current position (x >= mapSize)', () => {
            expect(() => service.getNextPosition(mockSessionId, MAP_SIZE_NUM, 0, Orientation.N)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException for invalid current position (y >= mapSize)', () => {
            expect(() => service.getNextPosition(mockSessionId, 0, MAP_SIZE_NUM, Orientation.N)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when next position is out of bounds (north)', () => {
            expect(() => service.getNextPosition(mockSessionId, POS_X_0, POS_Y_0, Orientation.N)).toThrow(BadRequestException);
            expect(() => service.getNextPosition(mockSessionId, POS_X_0, POS_Y_0, Orientation.N)).toThrow('Next position is out of bounds');
        });

        it('should throw BadRequestException when next position is out of bounds (east)', () => {
            const LAST_POSITION = MAP_SIZE_NUM - 1;
            expect(() => service.getNextPosition(mockSessionId, LAST_POSITION, POS_Y_0, Orientation.E)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when next position is out of bounds (south)', () => {
            const LAST_POSITION = MAP_SIZE_NUM - 1;
            expect(() => service.getNextPosition(mockSessionId, POS_X_0, LAST_POSITION, Orientation.S)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when next position is out of bounds (west)', () => {
            expect(() => service.getNextPosition(mockSessionId, POS_X_0, POS_Y_0, Orientation.W)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when game not found', () => {
            expect(() => service.getNextPosition('non-existent-session', POS_X_0, POS_Y_0, Orientation.N)).toThrow(NotFoundException);
        });
    });

    describe('getPlaceablesAtPosition', () => {
        it('should return placed placeables at position', async () => {
            const placeables: Placeable[] = [
                { _id: new Types.ObjectId(), kind: PlaceableKind.FLAG, x: POS_X_2, y: POS_Y_3, placed: true },
                { _id: new Types.ObjectId(), kind: PlaceableKind.HEAL, x: POS_X_2, y: POS_Y_3, placed: true },
                { _id: new Types.ObjectId(), kind: PlaceableKind.BOAT, x: POS_X_1, y: POS_Y_1, placed: true },
            ];
            const mockGame = createMockGame({ objects: placeables });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getPlaceablesAtPosition(mockSessionId, POS_X_2, POS_Y_3);

            expect(result).toHaveLength(EXPECTED_PLACEABLES_COUNT);
            expect(result.every((obj) => obj.x === POS_X_2 && obj.y === POS_Y_3 && obj.placed)).toBe(true);
        });

        it('should not return unplaced placeables', async () => {
            const placeables: Placeable[] = [
                { _id: new Types.ObjectId(), kind: PlaceableKind.FLAG, x: POS_X_2, y: POS_Y_3, placed: false },
                { _id: new Types.ObjectId(), kind: PlaceableKind.HEAL, x: POS_X_2, y: POS_Y_3, placed: true },
            ];
            const mockGame = createMockGame({ objects: placeables });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getPlaceablesAtPosition(mockSessionId, POS_X_2, POS_Y_3);

            expect(result).toHaveLength(EXPECTED_PLACEABLES_COUNT_ONE);
            expect(result[0].kind).toBe(PlaceableKind.HEAL);
        });

        it('should return empty array when no placeables at position', async () => {
            const mockGame = createMockGame();
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getPlaceablesAtPosition(mockSessionId, POS_FAR_OUT_OF_BOUNDS, POS_FAR_OUT_OF_BOUNDS);

            expect(result).toEqual([]);
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getPlaceablesAtPosition('non-existent-session', POS_X_0, POS_Y_0)).toThrow(NotFoundException);
        });
    });

    describe('getMapSize', () => {
        it('should return map size from cached game', async () => {
            const mockGame = createMockGame({ size: MapSize.LARGE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            const result = service.getMapSize(mockSessionId);

            expect(result).toBe(MapSize.LARGE);
        });

        it('should throw NotFoundException when game not found', () => {
            expect(() => service.getMapSize('non-existent-session')).toThrow(NotFoundException);
        });
    });

    describe('setTileOccupant', () => {
        const MAP_SIZE = MapSize.MEDIUM;
        const MAP_SIZE_NUM = 15;

        beforeEach(async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
            await service.fetchAndCacheGame(mockSessionId, mockGameId);
        });

        it('should set playerId on tile at position', () => {
            const player = createMockPlayer({ x: POS_X_2, y: POS_Y_3 });

            service.setTileOccupant(mockSessionId, POS_X_2, POS_Y_3, player);

            const tile = service.getTileAtPosition(mockSessionId, POS_X_2, POS_Y_3);
            expect(tile?.playerId).toBe('player-123');
        });

        it('should throw NotFoundException when game map not found', () => {
            const player = createMockPlayer();

            expect(() => service.setTileOccupant('non-existent-session', POS_X_0, POS_Y_0, player)).toThrow(NotFoundException);
        });
    });

    describe('moveTileOccupant', () => {
        const MAP_SIZE = MapSize.MEDIUM;
        const MAP_SIZE_NUM = 15;

        beforeEach(async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
            await service.fetchAndCacheGame(mockSessionId, mockGameId);
        });

        it('should clear old position and set new position', () => {
            const player = createMockPlayer({ x: POS_X_1, y: POS_Y_1 });

            service.setTileOccupant(mockSessionId, POS_X_1, POS_Y_1, player);
            service.moveTileOccupant(mockSessionId, POS_X_2, POS_Y_3, player);

            expect(service.getTileOccupant(mockSessionId, POS_X_1, POS_Y_1)).toBeNull();
            expect(service.getTileOccupant(mockSessionId, POS_X_2, POS_Y_3)).toBe('player-123');
        });

        it('should throw NotFoundException when game map not found (in clearTileOccupant)', () => {
            const player = createMockPlayer();

            expect(() => service.moveTileOccupant('non-existent-session', POS_X_1, POS_Y_1, player)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when game map not found (after clearTileOccupant)', () => {
            const player = createMockPlayer({ x: POS_X_1, y: POS_Y_1 });
            service.setTileOccupant(mockSessionId, POS_X_1, POS_Y_1, player);

            type ServiceWithPrivateMap = {
                sessionsGameMaps: Map<string, unknown>;
                clearTileOccupant: (sessionId: string, x: number, y: number) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMap;

            const clearTileOccupantSpy = jest.spyOn(servicePrivate, 'clearTileOccupant').mockImplementation(() => {
                servicePrivate.sessionsGameMaps.delete(mockSessionId);
            });

            expect(() => service.moveTileOccupant(mockSessionId, POS_X_2, POS_Y_3, player)).toThrow(NotFoundException);
            expect(() => service.moveTileOccupant(mockSessionId, POS_X_2, POS_Y_3, player)).toThrow('Game map not found');
            expect(clearTileOccupantSpy).toHaveBeenCalled();

            clearTileOccupantSpy.mockRestore();
        });
    });

    describe('clearTileOccupant', () => {
        const MAP_SIZE = MapSize.MEDIUM;
        const MAP_SIZE_NUM = 15;

        beforeEach(async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
            await service.fetchAndCacheGame(mockSessionId, mockGameId);
        });

        it('should set playerId to null on tile at position', () => {
            const player = createMockPlayer({ x: POS_X_2, y: POS_Y_3 });

            service.setTileOccupant(mockSessionId, POS_X_2, POS_Y_3, player);
            expect(service.getTileOccupant(mockSessionId, POS_X_2, POS_Y_3)).toBe('player-123');

            service.clearTileOccupant(mockSessionId, POS_X_2, POS_Y_3);

            expect(service.getTileOccupant(mockSessionId, POS_X_2, POS_Y_3)).toBeNull();
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.clearTileOccupant('non-existent-session', POS_X_0, POS_Y_0)).toThrow(NotFoundException);
        });
    });

    describe('getTileOccupant', () => {
        const MAP_SIZE = MapSize.MEDIUM;
        const MAP_SIZE_NUM = 15;

        beforeEach(async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
            await service.fetchAndCacheGame(mockSessionId, mockGameId);
        });

        it('should return playerId when tile is occupied', () => {
            const player = createMockPlayer({ x: POS_X_2, y: POS_Y_3 });

            service.setTileOccupant(mockSessionId, POS_X_2, POS_Y_3, player);

            const result = service.getTileOccupant(mockSessionId, POS_X_2, POS_Y_3);

            expect(result).toBe('player-123');
        });

        it('should return null when tile is not occupied', () => {
            const result = service.getTileOccupant(mockSessionId, POS_X_0, POS_Y_0);

            expect(result).toBeNull();
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getTileOccupant('non-existent-session', POS_X_0, POS_Y_0)).toThrow(NotFoundException);
        });
    });

    describe('isTileFree', () => {
        const MAP_SIZE = MapSize.MEDIUM;
        const MAP_SIZE_NUM = 15;

        beforeEach(async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            tiles[POS_Y_2 * MAP_SIZE_NUM + POS_X_2] = { x: POS_X_2, y: POS_Y_2, kind: TileKind.DOOR, open: false };
            tiles[POS_Y_2 * MAP_SIZE_NUM + POS_X_3] = { x: POS_X_3, y: POS_Y_2, kind: TileKind.DOOR, open: true };
            tiles[POS_Y_2 * MAP_SIZE_NUM + POS_X_4] = { x: POS_X_4, y: POS_Y_2, kind: TileKind.WALL };
            tiles[POS_Y_3 * MAP_SIZE_NUM + POS_X_0] = { x: POS_X_0, y: POS_Y_3, kind: TileKind.WATER };
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
            await service.fetchAndCacheGame(mockSessionId, mockGameId);
        });

        it('should return true for free base tile', () => {
            const result = service.isTileFree(mockSessionId, POS_X_0, POS_Y_0);

            expect(result).toBe(true);
        });

        it('should return false when tile is occupied', () => {
            const player = createMockPlayer({ x: POS_X_1, y: POS_Y_1 });

            service.setTileOccupant(mockSessionId, POS_X_1, POS_Y_1, player);

            const result = service.isTileFree(mockSessionId, POS_X_1, POS_Y_1);

            expect(result).toBe(false);
        });

        it('should return false when tile does not exist (empty array)', async () => {
            const tiles: Tile[] = [];
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
            await service.fetchAndCacheGame('session-empty', mockGameId);

            expect(() => service.isTileFree('session-empty', POS_X_0, POS_Y_0)).toThrow();
        });

        it('should return false when tile is out of bounds (getTileAtPosition returns undefined)', async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
            await service.fetchAndCacheGame('session-out-of-bounds', mockGameId);

            jest.spyOn(service, 'getTileOccupant').mockReturnValue(null);
            jest.spyOn(service, 'getTileAtPosition').mockReturnValue(undefined);

            const result = service.isTileFree('session-out-of-bounds', MAP_SIZE_NUM, MAP_SIZE_NUM);

            expect(result).toBe(false);
        });

        it('should return false for door tile', () => {
            const result = service.isTileFree(mockSessionId, POS_X_2, POS_Y_2);

            expect(result).toBe(false);
        });

        it('should return false for wall tile', () => {
            const result = service.isTileFree(mockSessionId, POS_X_4, POS_Y_2);

            expect(result).toBe(false);
        });

        it('should return true for open door', () => {
            const result = service.isTileFree(mockSessionId, POS_X_3, POS_Y_2);

            expect(result).toBe(true);
        });

        it('should return true for water tile', () => {
            const result = service.isTileFree(mockSessionId, POS_X_0, POS_Y_3);

            expect(result).toBe(true);
        });

        it('should return true for ice tile', async () => {
            const tiles: Tile[] = [];
            for (let y = 0; y < MAP_SIZE_NUM; y++) {
                for (let x = 0; x < MAP_SIZE_NUM; x++) {
                    tiles.push({ x, y, kind: TileKind.BASE });
                }
            }
            tiles[POS_X_0] = { x: POS_X_0, y: POS_Y_0, kind: TileKind.ICE };
            const mockGame = createMockGame({ tiles, size: MAP_SIZE });
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
            await service.fetchAndCacheGame('session-ice', mockGameId);

            const result = service.isTileFree('session-ice', POS_X_0, POS_Y_0);

            expect(result).toBe(true);
        });
    });

    describe('clearSessionGameCache', () => {
        beforeEach(() => {
            const mockGame = createMockGame();
            mockModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });
        });

        it('should clear both sessionsGames and sessionsGameMaps for a session', async () => {
            await service.fetchAndCacheGame(mockSessionId, mockGameId);

            expect(service.getGameForSession(mockSessionId)).toBeDefined();
            expect(service.getGameMapForSession(mockSessionId)).toBeDefined();

            service.clearSessionGameCache(mockSessionId);

            expect(() => service.getGameForSession(mockSessionId)).toThrow(NotFoundException);
            expect(() => service.getGameMapForSession(mockSessionId)).toThrow(NotFoundException);
        });

        it('should not throw error when clearing non-existent session cache', () => {
            expect(() => service.clearSessionGameCache('non-existent-session')).not.toThrow();
        });
    });
});
