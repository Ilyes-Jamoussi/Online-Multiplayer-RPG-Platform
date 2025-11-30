import { ServerEvents } from '@app/enums/server-events.enum';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { GameCacheService } from './game-cache.service';

const MOCK_SESSION_ID = 'session-123';
const MOCK_GAME_ID = 'game-123';
const MOCK_PLAYER_ID = 'player-123';
const MOCK_PLACEABLE_ID = 'placeable-123';
const MOCK_X = 5;
const MOCK_Y = 10;
const MOCK_X_2 = 6;
const MOCK_Y_2 = 11;
const MOCK_TELEPORT_CHANNEL = 1;
const MOCK_TURN_COUNT = 2;
const MOCK_DECREMENTED_TURN_COUNT = 1;
const MOCK_OFFSET_X = 0;
const MOCK_OFFSET_Y = 0;
const MOCK_OFFSET_X_2 = 1;
const MOCK_OFFSET_Y_2 = 1;
const MOCK_INDEX = 155;
const MOCK_TELEPORT_INDEX_A = 10;
const MOCK_TELEPORT_INDEX_B = 20;
const MOCK_TELEPORT_X_A = 0;
const MOCK_TELEPORT_Y_A = 0;
const MOCK_TELEPORT_X_B = 1;
const MOCK_TELEPORT_Y_B = 1;
const MOCK_PLAYER_NAME = 'Test Player';
const MOCK_GAME_NAME = 'Test Game';
const MOCK_GAME_DESCRIPTION = 'Test Description';

const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: MOCK_PLAYER_ID,
    name: MOCK_PLAYER_NAME,
    avatar: Avatar.Avatar1,
    isAdmin: false,
    baseHealth: 100,
    healthBonus: 0,
    health: 100,
    maxHealth: 100,
    baseSpeed: 3,
    speedBonus: 0,
    speed: 3,
    boatSpeedBonus: 0,
    boatSpeed: 0,
    baseAttack: 10,
    attackBonus: 0,
    baseDefense: 5,
    defenseBonus: 0,
    attackDice: Dice.D6,
    defenseDice: Dice.D4,
    x: MOCK_X,
    y: MOCK_Y,
    isInGame: true,
    startPointId: '',
    actionsRemaining: 1,
    combatCount: 0,
    combatWins: 0,
    combatLosses: 0,
    combatDraws: 0,
    hasCombatBonus: false,
    ...overrides,
});

const createMockTile = (overrides: Partial<Tile> = {}): Tile => ({
    x: MOCK_X,
    y: MOCK_Y,
    kind: TileKind.BASE,
    open: false,
    ...overrides,
});

const createMockPlaceable = (overrides: Partial<Placeable> = {}): Placeable => {
    const mockObjectId = new Types.ObjectId();
    Object.defineProperty(mockObjectId, 'toString', {
        value: jest.fn().mockReturnValue(MOCK_PLACEABLE_ID),
        writable: true,
    });
    return {
        _id: mockObjectId,
        kind: PlaceableKind.START,
        x: MOCK_X,
        y: MOCK_Y,
        placed: true,
        ...overrides,
    };
};

const createMockGame = (overrides: Partial<Game> = {}): Game => {
    const mockObjectId = new Types.ObjectId();
    Object.defineProperty(mockObjectId, 'toString', {
        value: jest.fn().mockReturnValue(MOCK_GAME_ID),
        writable: true,
    });
    return {
        _id: mockObjectId,
        name: MOCK_GAME_NAME,
        description: MOCK_GAME_DESCRIPTION,
        size: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        visibility: true,
        lastModified: new Date(),
        createdAt: new Date(),
        gridPreviewUrl: '',
        tiles: [],
        objects: [],
        draft: false,
        teleportChannels: [],
        ...overrides,
    };
};

const createMockGameMapTiles = (size: number, tileAtPosition?: { x: number; y: number; tile: Tile & { playerId: string | null } }): (Tile & { playerId: string | null })[] => {
    const tiles: (Tile & { playerId: string | null })[] = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (tileAtPosition && tileAtPosition.x === x && tileAtPosition.y === y) {
                tiles.push(tileAtPosition.tile);
            } else {
                tiles.push({ ...createMockTile({ x, y }), playerId: null });
            }
        }
    }
    return tiles;
};

describe('GameCacheService', () => {
    let service: GameCacheService;
    let mockGameModel: jest.Mocked<Model<Game>>;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(async () => {
        mockEventEmitter = {
            emit: jest.fn(),
        } as unknown as jest.Mocked<EventEmitter2>;

        mockGameModel = {
            findById: jest.fn(),
        } as unknown as jest.Mocked<Model<Game>>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameCacheService,
                { provide: getModelToken(Game.name), useValue: mockGameModel },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile();

        service = module.get<GameCacheService>(GameCacheService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('hidePlaceable', () => {
        it('should hide placeable and emit PlaceableUpdated event', () => {
            const gameMap = {
                tiles: [],
                objects: [createMockPlaceable({ x: MOCK_X, y: MOCK_Y })],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.hidePlaceable(MOCK_SESSION_ID, position);

            expect(gameMap.objects[0].placed).toBe(false);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.PlaceableUpdated,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    placeable: expect.objectContaining({
                        id: MOCK_PLACEABLE_ID,
                    }),
                }),
            );
        });

        it('should throw NotFoundException when game map not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.hidePlaceable(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when placeable not found', () => {
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.hidePlaceable(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });
    });

    describe('showPlaceable', () => {
        it('should show placeable and emit PlaceableUpdated event', () => {
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y, placed: false });
            const gameMap = {
                tiles: [],
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.showPlaceable(MOCK_SESSION_ID, position);

            expect(placeable.placed).toBe(true);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.PlaceableUpdated,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    placeable: expect.objectContaining({
                        id: MOCK_PLACEABLE_ID,
                    }),
                }),
            );
        });

        it('should throw NotFoundException when game map not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.showPlaceable(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when placeable not found', () => {
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.showPlaceable(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });
    });

    describe('fetchAndCacheGame', () => {
        it('should fetch and cache game successfully', async () => {
            const mockGame = createMockGame({
                tiles: [createMockTile()],
                objects: [createMockPlaceable({ placed: true })],
                size: MapSize.MEDIUM,
            });
            mockGameModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            const result = await service.fetchAndCacheGame(MOCK_SESSION_ID, MOCK_GAME_ID);

            expect(result).toEqual(mockGame);
            expect(mockGameModel.findById).toHaveBeenCalledWith(MOCK_GAME_ID);
        });

        it('should expand placeables with footprint 2', async () => {
            const placeable = createMockPlaceable({
                kind: PlaceableKind.HEAL,
                x: MOCK_X,
                y: MOCK_Y,
                placed: true,
            });
            const mockGame = createMockGame({
                tiles: [createMockTile()],
                objects: [placeable],
                size: MapSize.MEDIUM,
            });
            mockGameModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(MOCK_SESSION_ID, MOCK_GAME_ID);

            const gameMap = (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.get(MOCK_SESSION_ID);
            expect((gameMap as { objects: Placeable[] }).objects.length).toBe(PlaceableFootprint[PlaceableKind.HEAL] * PlaceableFootprint[PlaceableKind.HEAL]);
        });

        it('should skip unplaced placeables', async () => {
            const placedPlaceable = createMockPlaceable({ placed: true });
            const unplacedPlaceable = createMockPlaceable({ placed: false });
            const mockGame = createMockGame({
                tiles: [createMockTile()],
                objects: [placedPlaceable, unplacedPlaceable],
                size: MapSize.MEDIUM,
            });
            mockGameModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(MOCK_SESSION_ID, MOCK_GAME_ID);

            const gameMap = (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.get(MOCK_SESSION_ID);
            const objects = (gameMap as { objects: Placeable[] }).objects;
            expect(objects.every((obj) => obj.placed)).toBe(true);
        });

        it('should set teleport tiles correctly', async () => {
            const mockGame = createMockGame({
                tiles: Array.from({ length: MapSize.MEDIUM * MapSize.MEDIUM }, (_, i) =>
                    createMockTile({ x: i % MapSize.MEDIUM, y: Math.floor(i / MapSize.MEDIUM) }),
                ),
                objects: [],
                size: MapSize.MEDIUM,
                teleportChannels: [
                    {
                        channelNumber: MOCK_TELEPORT_CHANNEL,
                        tiles: {
                            entryA: { x: MOCK_TELEPORT_X_A, y: MOCK_TELEPORT_Y_A },
                            entryB: { x: MOCK_TELEPORT_X_B, y: MOCK_TELEPORT_Y_B },
                        },
                    },
                ],
            });
            mockGameModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockGame),
            });

            await service.fetchAndCacheGame(MOCK_SESSION_ID, MOCK_GAME_ID);

            const gameMap = (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.get(MOCK_SESSION_ID);
            const tiles = (gameMap as { tiles: (Tile & { playerId: string | null })[] }).tiles;
            const tileA = tiles[MOCK_TELEPORT_Y_A * MapSize.MEDIUM + MOCK_TELEPORT_X_A];
            const tileB = tiles[MOCK_TELEPORT_Y_B * MapSize.MEDIUM + MOCK_TELEPORT_X_B];
            expect(tileA.kind).toBe(TileKind.TELEPORT);
            expect(tileA.teleportChannel).toBe(MOCK_TELEPORT_CHANNEL);
            expect(tileB.kind).toBe(TileKind.TELEPORT);
            expect(tileB.teleportChannel).toBe(MOCK_TELEPORT_CHANNEL);
        });

        it('should throw NotFoundException when game not found', async () => {
            mockGameModel.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(service.fetchAndCacheGame(MOCK_SESSION_ID, MOCK_GAME_ID)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getTileByPlayerId', () => {
        it('should return tile with matching playerId', () => {
            const tile = createMockTile();
            const gameMap = {
                tiles: [{ ...tile, playerId: MOCK_PLAYER_ID }],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getTileByPlayerId(MOCK_SESSION_ID, MOCK_PLAYER_ID);

            expect(result?.playerId).toBe(MOCK_PLAYER_ID);
        });

        it('should return undefined when tile not found', () => {
            const gameMap = {
                tiles: [{ ...createMockTile(), playerId: null }],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getTileByPlayerId(MOCK_SESSION_ID, MOCK_PLAYER_ID);

            expect(result).toBeUndefined();
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getTileByPlayerId(MOCK_SESSION_ID, MOCK_PLAYER_ID)).toThrow(NotFoundException);
        });
    });

    describe('getGameForSession', () => {
        it('should return cached game', () => {
            const mockGame = createMockGame();
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);

            const result = service.getGameForSession(MOCK_SESSION_ID);

            expect(result).toEqual(mockGame);
        });

        it('should throw NotFoundException when game not found', () => {
            expect(() => service.getGameForSession(MOCK_SESSION_ID)).toThrow(NotFoundException);
        });
    });

    describe('getGameMapForSession', () => {
        it('should return cached game map', () => {
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getGameMapForSession(MOCK_SESSION_ID);

            expect(result).toEqual(gameMap);
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getGameMapForSession(MOCK_SESSION_ID)).toThrow(NotFoundException);
        });
    });

    describe('getTileAtPosition', () => {
        it('should return tile at position', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: null } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getTileAtPosition(MOCK_SESSION_ID, position);

            expect(result).toBeDefined();
            expect(result?.x).toBe(MOCK_X);
            expect(result?.y).toBe(MOCK_Y);
        });

        it('should throw NotFoundException when game map not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.getTileAtPosition(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });
    });

    describe('getTeleportDestination', () => {
        it('should return destination when at entryA', () => {
            const mockGame = createMockGame({
                teleportChannels: [
                    {
                        channelNumber: MOCK_TELEPORT_CHANNEL,
                        tiles: {
                            entryA: { x: MOCK_X, y: MOCK_Y },
                            entryB: { x: MOCK_X_2, y: MOCK_Y_2 },
                        },
                    },
                ],
            });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getTeleportDestination(MOCK_SESSION_ID, position);

            expect(result).toEqual({ x: MOCK_X_2, y: MOCK_Y_2 });
        });

        it('should return destination when at entryB', () => {
            const mockGame = createMockGame({
                teleportChannels: [
                    {
                        channelNumber: MOCK_TELEPORT_CHANNEL,
                        tiles: {
                            entryA: { x: MOCK_X, y: MOCK_Y },
                            entryB: { x: MOCK_X_2, y: MOCK_Y_2 },
                        },
                    },
                ],
            });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };

            const result = service.getTeleportDestination(MOCK_SESSION_ID, position);

            expect(result).toEqual({ x: MOCK_X, y: MOCK_Y });
        });

        it('should throw NotFoundException when entryB is undefined', () => {
            const mockGame = createMockGame({
                teleportChannels: [
                    {
                        channelNumber: MOCK_TELEPORT_CHANNEL,
                        tiles: {
                            entryA: { x: MOCK_X, y: MOCK_Y },
                            entryB: undefined,
                        },
                    },
                ],
            });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.getTeleportDestination(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when entryA is undefined', () => {
            const mockGame = createMockGame({
                teleportChannels: [
                    {
                        channelNumber: MOCK_TELEPORT_CHANNEL,
                        tiles: {
                            entryA: undefined,
                            entryB: { x: MOCK_X_2, y: MOCK_Y_2 },
                        },
                    },
                ],
            });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };

            expect(() => service.getTeleportDestination(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when teleport channel not found', () => {
            const mockGame = createMockGame();
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.getTeleportDestination(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when game not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.getTeleportDestination(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });
    });

    describe('getNextPosition', () => {
        it('should return next position for Orientation.N', () => {
            const mockGame = createMockGame({ size: MapSize.MEDIUM });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getNextPosition(MOCK_SESSION_ID, position, Orientation.N);

            expect(result).toEqual({ x: MOCK_X, y: MOCK_Y - 1 });
        });

        it('should return next position for Orientation.E', () => {
            const mockGame = createMockGame({ size: MapSize.MEDIUM });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getNextPosition(MOCK_SESSION_ID, position, Orientation.E);

            expect(result).toEqual({ x: MOCK_X + 1, y: MOCK_Y });
        });

        it('should return next position for Orientation.S', () => {
            const mockGame = createMockGame({ size: MapSize.MEDIUM });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getNextPosition(MOCK_SESSION_ID, position, Orientation.S);

            expect(result).toEqual({ x: MOCK_X, y: MOCK_Y + 1 });
        });

        it('should return next position for Orientation.W', () => {
            const mockGame = createMockGame({ size: MapSize.MEDIUM });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getNextPosition(MOCK_SESSION_ID, position, Orientation.W);

            expect(result).toEqual({ x: MOCK_X - 1, y: MOCK_Y });
        });

        it('should throw BadRequestException when position is invalid', () => {
            const mockGame = createMockGame({ size: MapSize.MEDIUM });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: -1, y: MOCK_Y };

            expect(() => service.getNextPosition(MOCK_SESSION_ID, position, Orientation.N)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when next position is out of bounds', () => {
            const mockGame = createMockGame({ size: MapSize.MEDIUM });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            const position: Position = { x: 0, y: 0 };

            expect(() => service.getNextPosition(MOCK_SESSION_ID, position, Orientation.N)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when game not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.getNextPosition(MOCK_SESSION_ID, position, Orientation.N)).toThrow(NotFoundException);
        });
    });

    describe('getPlaceablesById', () => {
        it('should return placeables with matching id', () => {
            const placeable = createMockPlaceable();
            const gameMap = {
                tiles: [],
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getPlaceablesById(MOCK_SESSION_ID, MOCK_PLACEABLE_ID);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0]._id?.toString()).toBe(MOCK_PLACEABLE_ID);
        });

        it('should filter by placedOnly when true', () => {
            const placedPlaceable = createMockPlaceable({ placed: true });
            const unplacedPlaceable = createMockPlaceable({ placed: false });
            const gameMap = {
                tiles: [],
                objects: [placedPlaceable, unplacedPlaceable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getPlaceablesById(MOCK_SESSION_ID, MOCK_PLACEABLE_ID, true);

            expect(result.every((p) => p.placed)).toBe(true);
        });

        it('should include unplaced when placedOnly is false', () => {
            const placedPlaceable = createMockPlaceable({ placed: true });
            const unplacedPlaceable = createMockPlaceable({ placed: false });
            const gameMap = {
                tiles: [],
                objects: [placedPlaceable, unplacedPlaceable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getPlaceablesById(MOCK_SESSION_ID, MOCK_PLACEABLE_ID, false);

            expect(result.length).toBeGreaterThan(1);
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getPlaceablesById(MOCK_SESSION_ID, MOCK_PLACEABLE_ID)).toThrow(NotFoundException);
        });
    });

    describe('getPlaceablesAtPosition', () => {
        it('should return placeables at position', () => {
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: [],
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getPlaceablesAtPosition(MOCK_SESSION_ID, position);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].x).toBe(MOCK_X);
            expect(result[0].y).toBe(MOCK_Y);
        });

        it('should throw NotFoundException when game map not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.getPlaceablesAtPosition(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });
    });

    describe('getPlaceableAtPosition', () => {
        it('should return placeable at position', () => {
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: [],
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getPlaceableAtPosition(MOCK_SESSION_ID, position);

            expect(result).toBeDefined();
            expect(result?.x).toBe(MOCK_X);
            expect(result?.y).toBe(MOCK_Y);
        });

        it('should return undefined when placeable not found', () => {
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getPlaceableAtPosition(MOCK_SESSION_ID, position);

            expect(result).toBeUndefined();
        });

        it('should throw NotFoundException when game map not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.getPlaceableAtPosition(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });
    });

    describe('getPlaceablePositions', () => {
        it('should return positions of placeables with matching id', () => {
            const placeable1 = createMockPlaceable({ x: MOCK_X, y: MOCK_Y });
            const placeable2 = createMockPlaceable({ x: MOCK_X_2, y: MOCK_Y_2 });
            const gameMap = {
                tiles: [],
                objects: [placeable1, placeable2],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getPlaceablePositions(MOCK_SESSION_ID, MOCK_PLACEABLE_ID);

            expect(result.length).toBeGreaterThan(0);
            expect(result).toContainEqual({ x: MOCK_X, y: MOCK_Y });
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getPlaceablePositions(MOCK_SESSION_ID, MOCK_PLACEABLE_ID)).toThrow(NotFoundException);
        });
    });

    describe('getFlagPlaceable', () => {
        it('should return flag placeable', () => {
            const flagPlaceable = createMockPlaceable({ kind: PlaceableKind.FLAG });
            const gameMap = {
                tiles: [],
                objects: [flagPlaceable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getFlagPlaceable(MOCK_SESSION_ID);

            expect(result).toBeDefined();
            expect(result?.kind).toBe(PlaceableKind.FLAG);
        });

        it('should return undefined when flag not found', () => {
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getFlagPlaceable(MOCK_SESSION_ID);

            expect(result).toBeUndefined();
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getFlagPlaceable(MOCK_SESSION_ID)).toThrow(NotFoundException);
        });
    });

    describe('getMapSize', () => {
        it('should return map size', () => {
            const mockGame = createMockGame({ size: MapSize.MEDIUM });
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);

            const result = service.getMapSize(MOCK_SESSION_ID);

            expect(result).toBe(MapSize.MEDIUM);
        });

        it('should throw NotFoundException when game not found', () => {
            expect(() => service.getMapSize(MOCK_SESSION_ID)).toThrow(NotFoundException);
        });
    });

    describe('setTileOccupant', () => {
        it('should set tile occupant', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: null } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const player = createMockPlayer();
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.setTileOccupant(MOCK_SESSION_ID, position, player);

            expect(gameMap.tiles[MOCK_Y * MapSize.MEDIUM + MOCK_X].playerId).toBe(MOCK_PLAYER_ID);
        });

        it('should throw NotFoundException when game map not found', () => {
            const player = createMockPlayer();
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.setTileOccupant(MOCK_SESSION_ID, position, player)).toThrow(NotFoundException);
        });
    });

    describe('moveTileOccupant', () => {
        it('should move tile occupant', () => {
            const oldTile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const newTile = createMockTile({ x: MOCK_X_2, y: MOCK_Y_2 });
            const tiles = createMockGameMapTiles(MapSize.MEDIUM);
            tiles[MOCK_Y * MapSize.MEDIUM + MOCK_X] = { ...oldTile, playerId: MOCK_PLAYER_ID };
            tiles[MOCK_Y_2 * MapSize.MEDIUM + MOCK_X_2] = { ...newTile, playerId: null };
            const gameMap = {
                tiles,
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const player = createMockPlayer({ x: MOCK_X, y: MOCK_Y });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };

            service.moveTileOccupant(MOCK_SESSION_ID, position, player);

            expect(gameMap.tiles[MOCK_Y * MapSize.MEDIUM + MOCK_X].playerId).toBeNull();
            expect(gameMap.tiles[MOCK_Y_2 * MapSize.MEDIUM + MOCK_X_2].playerId).toBe(MOCK_PLAYER_ID);
        });

        it('should throw NotFoundException when game map not found', () => {
            const player = createMockPlayer();
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.moveTileOccupant(MOCK_SESSION_ID, position, player)).toThrow(NotFoundException);
        });
    });

    describe('clearTileOccupant', () => {
        it('should clear tile occupant', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: MOCK_PLAYER_ID } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.clearTileOccupant(MOCK_SESSION_ID, position);

            expect(gameMap.tiles[MOCK_Y * MapSize.MEDIUM + MOCK_X].playerId).toBeNull();
        });

        it('should throw NotFoundException when game map not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.clearTileOccupant(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });
    });

    describe('getTileOccupant', () => {
        it('should return tile occupant', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: MOCK_PLAYER_ID } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getTileOccupant(MOCK_SESSION_ID, position);

            expect(result).toBe(MOCK_PLAYER_ID);
        });

        it('should return null when no occupant', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: null } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.getTileOccupant(MOCK_SESSION_ID, position);

            expect(result).toBeNull();
        });

        it('should throw NotFoundException when game map not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.getTileOccupant(MOCK_SESSION_ID, position)).toThrow(NotFoundException);
        });
    });

    describe('disablePlaceable', () => {
        it('should disable placeable and emit event', () => {
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: [],
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.disablePlaceable(MOCK_SESSION_ID, position, MOCK_PLAYER_ID);

            const disabledMap = (service as unknown as { disabledPlaceables: Map<string, Map<string, { playerId: string; turnCount: number }>> }).disabledPlaceables.get(MOCK_SESSION_ID);
            expect(disabledMap).toBeDefined();
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.PlaceableDisabledUpdated,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    placeableId: MOCK_PLACEABLE_ID,
                    turnCount: MOCK_TURN_COUNT,
                }),
            );
        });

        it('should disable all placeables with same id', () => {
            const placeable1 = createMockPlaceable({ x: MOCK_X, y: MOCK_Y });
            const placeable2 = createMockPlaceable({ x: MOCK_X_2, y: MOCK_Y_2 });
            const gameMap = {
                tiles: [],
                objects: [placeable1, placeable2],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.disablePlaceable(MOCK_SESSION_ID, position, MOCK_PLAYER_ID);

            const disabledMap = (service as unknown as { disabledPlaceables: Map<string, Map<string, { playerId: string; turnCount: number }>> }).disabledPlaceables.get(MOCK_SESSION_ID);
            expect(disabledMap?.size).toBeGreaterThan(1);
        });

        it('should throw NotFoundException when object not found', () => {
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.disablePlaceable(MOCK_SESSION_ID, position, MOCK_PLAYER_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when game map not found', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.disablePlaceable(MOCK_SESSION_ID, position, MOCK_PLAYER_ID)).toThrow(NotFoundException);
        });
    });

    describe('isPlaceableDisabled', () => {
        it('should return true when placeable is disabled', () => {
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: [],
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const disabledMap = new Map<string, { playerId: string; turnCount: number }>();
            disabledMap.set(`${MOCK_PLACEABLE_ID}-${MOCK_X}-${MOCK_Y}`, { playerId: MOCK_PLAYER_ID, turnCount: MOCK_TURN_COUNT });
            (service as unknown as { disabledPlaceables: Map<string, Map<string, { playerId: string; turnCount: number }>> }).disabledPlaceables.set(MOCK_SESSION_ID, disabledMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isPlaceableDisabled(MOCK_SESSION_ID, position);

            expect(result).toBe(true);
        });

        it('should return false when placeable is not disabled', () => {
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: [],
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isPlaceableDisabled(MOCK_SESSION_ID, position);

            expect(result).toBe(false);
        });

        it('should return false when placeable not found', () => {
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isPlaceableDisabled(MOCK_SESSION_ID, position);

            expect(result).toBe(false);
        });

        it('should return false when turnCount is 0', () => {
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: [],
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const disabledMap = new Map<string, { playerId: string; turnCount: number }>();
            disabledMap.set(`${MOCK_PLACEABLE_ID}-${MOCK_X}-${MOCK_Y}`, { playerId: MOCK_PLAYER_ID, turnCount: 0 });
            (service as unknown as { disabledPlaceables: Map<string, Map<string, { playerId: string; turnCount: number }>> }).disabledPlaceables.set(MOCK_SESSION_ID, disabledMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isPlaceableDisabled(MOCK_SESSION_ID, position);

            expect(result).toBe(false);
        });
    });

    describe('decrementDisabledPlaceablesTurnCount', () => {
        it('should decrement turn count and emit event', () => {
            const disabledMap = new Map<string, { playerId: string; turnCount: number }>();
            disabledMap.set(`${MOCK_PLACEABLE_ID}-${MOCK_X}-${MOCK_Y}`, { playerId: MOCK_PLAYER_ID, turnCount: MOCK_TURN_COUNT });
            (service as unknown as { disabledPlaceables: Map<string, Map<string, { playerId: string; turnCount: number }>> }).disabledPlaceables.set(MOCK_SESSION_ID, disabledMap);

            service.decrementDisabledPlaceablesTurnCount(MOCK_SESSION_ID);

            expect(disabledMap.get(`${MOCK_PLACEABLE_ID}-${MOCK_X}-${MOCK_Y}`)?.turnCount).toBe(MOCK_DECREMENTED_TURN_COUNT);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.PlaceableDisabledUpdated,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    placeableId: MOCK_PLACEABLE_ID,
                    turnCount: MOCK_DECREMENTED_TURN_COUNT,
                }),
            );
        });

        it('should remove placeable when turnCount reaches 0', () => {
            const disabledMap = new Map<string, { playerId: string; turnCount: number }>();
            disabledMap.set(`${MOCK_PLACEABLE_ID}-${MOCK_X}-${MOCK_Y}`, { playerId: MOCK_PLAYER_ID, turnCount: 1 });
            (service as unknown as { disabledPlaceables: Map<string, Map<string, { playerId: string; turnCount: number }>> }).disabledPlaceables.set(MOCK_SESSION_ID, disabledMap);

            service.decrementDisabledPlaceablesTurnCount(MOCK_SESSION_ID);

            expect(disabledMap.has(`${MOCK_PLACEABLE_ID}-${MOCK_X}-${MOCK_Y}`)).toBe(false);
        });

        it('should do nothing when no disabled placeables', () => {
            service.decrementDisabledPlaceablesTurnCount(MOCK_SESSION_ID);

            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });
    });

    describe('reenablePlaceablesForPlayer', () => {
        it('should reenable placeables for player', () => {
            const disabledMap = new Map<string, { playerId: string; turnCount: number }>();
            disabledMap.set(`${MOCK_PLACEABLE_ID}-${MOCK_X}-${MOCK_Y}`, { playerId: MOCK_PLAYER_ID, turnCount: MOCK_TURN_COUNT });
            disabledMap.set(`${MOCK_PLACEABLE_ID}-${MOCK_X_2}-${MOCK_Y_2}`, { playerId: 'other-player', turnCount: MOCK_TURN_COUNT });
            (service as unknown as { disabledPlaceables: Map<string, Map<string, { playerId: string; turnCount: number }>> }).disabledPlaceables.set(MOCK_SESSION_ID, disabledMap);

            service.reenablePlaceablesForPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID);

            expect(disabledMap.has(`${MOCK_PLACEABLE_ID}-${MOCK_X}-${MOCK_Y}`)).toBe(false);
            expect(disabledMap.has(`${MOCK_PLACEABLE_ID}-${MOCK_X_2}-${MOCK_Y_2}`)).toBe(true);
        });

        it('should do nothing when no disabled placeables', () => {
            service.reenablePlaceablesForPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID);

            expect(true).toBe(true);
        });
    });

    describe('isTileFree', () => {
        it('should return false when tile has occupant', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: MOCK_PLAYER_ID } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isTileFree(MOCK_SESSION_ID, position);

            expect(result).toBe(false);
        });

        it('should return false when tile is WALL', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y, kind: TileKind.WALL });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: null } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isTileFree(MOCK_SESSION_ID, position);

            expect(result).toBe(false);
        });

        it('should return false when door is closed', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y, kind: TileKind.DOOR, open: false });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: null } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isTileFree(MOCK_SESSION_ID, position);

            expect(result).toBe(false);
        });

        it('should return true when door is open', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y, kind: TileKind.DOOR, open: true });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: null } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isTileFree(MOCK_SESSION_ID, position);

            expect(result).toBe(true);
        });

        it('should return false when tile not found', () => {
            const tiles = createMockGameMapTiles(MapSize.MEDIUM);
            const gameMap = {
                tiles,
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const invalidPosition: Position = { x: MapSize.MEDIUM, y: MapSize.MEDIUM };
            jest.spyOn(service, 'getTileOccupant').mockReturnValue(null);
            jest.spyOn(service, 'getTileAtPosition').mockReturnValue(undefined);

            const result = service.isTileFree(MOCK_SESSION_ID, invalidPosition);

            expect(result).toBe(false);
        });

        it('should return false when placeable is HEAL', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y, kind: PlaceableKind.HEAL });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: null } }),
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isTileFree(MOCK_SESSION_ID, position);

            expect(result).toBe(false);
        });

        it('should return false when placeable is FIGHT', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y, kind: PlaceableKind.FIGHT });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: null } }),
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isTileFree(MOCK_SESSION_ID, position);

            expect(result).toBe(false);
        });

        it('should return true when tile is free', () => {
            const tile = createMockTile({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: createMockGameMapTiles(MapSize.MEDIUM, { x: MOCK_X, y: MOCK_Y, tile: { ...tile, playerId: null } }),
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.isTileFree(MOCK_SESSION_ID, position);

            expect(result).toBe(true);
        });
    });

    describe('clearSessionGameCache', () => {
        it('should clear all caches for session', () => {
            const mockGame = createMockGame();
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.set(MOCK_SESSION_ID, mockGame);
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            (service as unknown as { disabledPlaceables: Map<string, Map<string, { playerId: string; turnCount: number }>> }).disabledPlaceables.set(MOCK_SESSION_ID, new Map());

            service.clearSessionGameCache(MOCK_SESSION_ID);

            expect((service as unknown as { sessionsGames: Map<string, Game> }).sessionsGames.has(MOCK_SESSION_ID)).toBe(false);
            expect((service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.has(MOCK_SESSION_ID)).toBe(false);
            expect((service as unknown as { disabledPlaceables: Map<string, Map<string, { playerId: string; turnCount: number }>> }).disabledPlaceables.has(MOCK_SESSION_ID)).toBe(false);
        });
    });

    describe('updatePlaceablePosition', () => {
        it('should update placeable position and emit event', () => {
            const placeable = createMockPlaceable({ x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: [],
                objects: [placeable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const fromPosition: Position = { x: MOCK_X, y: MOCK_Y };
            const toPosition: Position = { x: MOCK_X_2, y: MOCK_Y_2 };

            service.updatePlaceablePosition(MOCK_SESSION_ID, fromPosition, toPosition);

            expect(placeable.x).toBe(MOCK_X_2);
            expect(placeable.y).toBe(MOCK_Y_2);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.PlaceableUpdated,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    placeable: expect.objectContaining({
                        id: MOCK_PLACEABLE_ID,
                    }),
                }),
            );
        });

        it('should throw NotFoundException when placeable not found', () => {
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);
            const fromPosition: Position = { x: MOCK_X, y: MOCK_Y };
            const toPosition: Position = { x: MOCK_X_2, y: MOCK_Y_2 };

            expect(() => service.updatePlaceablePosition(MOCK_SESSION_ID, fromPosition, toPosition)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when game map not found', () => {
            const fromPosition: Position = { x: MOCK_X, y: MOCK_Y };
            const toPosition: Position = { x: MOCK_X_2, y: MOCK_Y_2 };

            expect(() => service.updatePlaceablePosition(MOCK_SESSION_ID, fromPosition, toPosition)).toThrow(NotFoundException);
        });
    });

    describe('getInitialFlagData', () => {
        it('should return flag data when flag exists', () => {
            const flagPlaceable = createMockPlaceable({ kind: PlaceableKind.FLAG, x: MOCK_X, y: MOCK_Y });
            const gameMap = {
                tiles: [],
                objects: [flagPlaceable],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getInitialFlagData(MOCK_SESSION_ID);

            expect(result).toBeDefined();
            expect(result?.position).toEqual({ x: MOCK_X, y: MOCK_Y });
            expect(result?.holderPlayerId).toBeNull();
        });

        it('should return undefined when flag not found', () => {
            const gameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            (service as unknown as { sessionsGameMaps: Map<string, unknown> }).sessionsGameMaps.set(MOCK_SESSION_ID, gameMap);

            const result = service.getInitialFlagData(MOCK_SESSION_ID);

            expect(result).toBeUndefined();
        });

        it('should throw NotFoundException when game map not found', () => {
            expect(() => service.getInitialFlagData(MOCK_SESSION_ID)).toThrow(NotFoundException);
        });
    });
});

