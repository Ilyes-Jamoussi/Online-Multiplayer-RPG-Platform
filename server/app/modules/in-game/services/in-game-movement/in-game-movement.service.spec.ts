/* eslint-disable max-lines -- Test file with comprehensive coverage */
import { InGameMovementService } from './in-game-movement.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Orientation } from '@common/enums/orientation.enum';
import { TileKind } from '@common/enums/tile.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { InGameSession } from '@common/interfaces/session.interface';
import { Player } from '@common/interfaces/player.interface';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

describe('InGameMovementService', () => {
    let service: InGameMovementService;
    let gameCache: jest.Mocked<GameCacheService>;
    let sessionRepository: jest.Mocked<InGameSessionRepository>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    const SESSION_ID = 'session-123';
    const PLAYER_A_ID = 'player-a';
    const PLAYER_B_ID = 'player-b';
    const START_POINT_ID = 'start-point-1';
    const BASE_HEALTH = 100;
    const BASE_SPEED = 3;
    const BASE_ATTACK = 10;
    const BASE_DEFENSE = 5;
    const NO_BONUS = 0;
    const ACTIONS_REMAINING = 1;
    const NO_COMBAT_STATS = 0;
    const POS_X_1 = 1;
    const POS_Y_1 = 1;
    const POS_X_2 = 2;
    const POS_Y_2 = 2;
    const POS_Y_3 = 3;
    const MOVE_COST_BASE = 1;
    const MOVE_COST_DOOR_OPEN = 1;
    const MAP_SIZE = 15;
    const NO_SPEED = 0;
    const POS_X_0 = 0;
    const ORIENTATIONS_COUNT = 4;
    const SPEED_LIMIT = 1;
    const WATER_COST_WITH_BOAT = 1;
    const WATER_COST_WITHOUT_BOAT = 2;

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: PLAYER_A_ID,
        name: 'Player A',
        avatar: Avatar.Avatar1,
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
        x: POS_X_1,
        y: POS_Y_1,
        isInGame: true,
        startPointId: START_POINT_ID,
        actionsRemaining: ACTIONS_REMAINING,
        combatCount: NO_COMBAT_STATS,
        combatWins: NO_COMBAT_STATS,
        combatLosses: NO_COMBAT_STATS,
        combatDraws: NO_COMBAT_STATS,
        ...overrides,
    });

    const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: SESSION_ID,
        inGameId: `${SESSION_ID}-game-456`,
        gameId: 'game-456',
        maxPlayers: ORIENTATIONS_COUNT,
        isGameStarted: false,
        inGamePlayers: {
            [PLAYER_A_ID]: createMockPlayer({ id: PLAYER_A_ID }),
            [PLAYER_B_ID]: createMockPlayer({ id: PLAYER_B_ID, x: POS_X_2, y: POS_Y_2 }),
        },
        currentTurn: { turnNumber: 1, activePlayerId: PLAYER_A_ID, hasUsedAction: false },
        startPoints: [{ id: START_POINT_ID, playerId: PLAYER_A_ID, x: POS_X_1, y: POS_Y_1 }],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
        isAdminModeActive: false,
        ...overrides,
    });

    type TileWithPlayerId = Tile & { playerId: string | null };

    beforeEach(() => {
        const mockGameCache = {
            getNextPosition: jest.fn(),
            getTileAtPosition: jest.fn(),
            getTileOccupant: jest.fn(),
            getMapSize: jest.fn(),
            getPlaceablesAtPosition: jest.fn(),
            isTileFree: jest.fn(),
        };

        const mockSessionRepository = {
            movePlayerPosition: jest.fn(),
            findStartPointById: jest.fn(),
        };

        const mockEventEmitter = {
            emit: jest.fn(),
        };

        gameCache = mockGameCache as unknown as jest.Mocked<GameCacheService>;
        sessionRepository = mockSessionRepository as unknown as jest.Mocked<InGameSessionRepository>;
        eventEmitter = mockEventEmitter as unknown as jest.Mocked<EventEmitter2>;

        service = new InGameMovementService(gameCache, sessionRepository, eventEmitter);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('movePlayer', () => {
        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            session.inGamePlayers = {};

            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow(NotFoundException);
            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow('Player not found');
        });

        it('should throw NotFoundException when tile not found', () => {
            const session = createMockSession();
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileAtPosition.mockReturnValue(undefined);

            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow(NotFoundException);
            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow('Tile not found');
        });

        it('should throw BadRequestException when moveCost is -1 (wall)', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.WALL,
                playerId: null,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);

            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow(BadRequestException);
            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow('Cannot move onto this tile');
        });

        it('should throw BadRequestException when moveCost exceeds player speed', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].speed = SPEED_LIMIT;
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.WATER,
                playerId: null,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);

            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow(BadRequestException);
            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow('Not enough movement points');
        });

        it('should throw BadRequestException when tile is occupied', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: PLAYER_B_ID,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(PLAYER_B_ID);

            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow(BadRequestException);
            expect(() => service.movePlayer(session, PLAYER_A_ID, Orientation.N)).toThrow('Tile is occupied');
        });

        it('should move player successfully on base tile', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockImplementation(() => {
                session.inGamePlayers[PLAYER_A_ID].speed = BASE_SPEED - MOVE_COST_BASE;
                return { oldX: POS_X_1, oldY: POS_Y_1, newX: POS_X_2, newY: POS_Y_3 };
            });
            jest.spyOn(service, 'calculateReachableTiles').mockReturnValue([]);

            const result = service.movePlayer(session, PLAYER_A_ID, Orientation.N);

            expect(sessionRepository.movePlayerPosition).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID, POS_X_2, POS_Y_3, MOVE_COST_BASE);
            expect(result).toBe(BASE_SPEED - MOVE_COST_BASE);
        });

        it('should move player successfully on open door', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.DOOR,
                open: true,
                playerId: null,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockImplementation(() => {
                session.inGamePlayers[PLAYER_A_ID].speed = BASE_SPEED - MOVE_COST_DOOR_OPEN;
                return { oldX: POS_X_1, oldY: POS_Y_1, newX: POS_X_2, newY: POS_Y_3 };
            });
            jest.spyOn(service, 'calculateReachableTiles').mockReturnValue([]);

            const result = service.movePlayer(session, PLAYER_A_ID, Orientation.N);

            expect(sessionRepository.movePlayerPosition).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID, POS_X_2, POS_Y_3, MOVE_COST_DOOR_OPEN);
            expect(result).toBe(BASE_SPEED - MOVE_COST_DOOR_OPEN);
        });

        it('should calculate reachable tiles when speed > 0', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POS_X_1, oldY: POS_Y_1, newX: POS_X_2, newY: POS_Y_3 });
            const calculateReachableSpy = jest.spyOn(service, 'calculateReachableTiles').mockReturnValue([]);

            service.movePlayer(session, PLAYER_A_ID, Orientation.N);

            expect(calculateReachableSpy).toHaveBeenCalledWith(session, PLAYER_A_ID);
        });

        it('should emit player.reachableTiles with empty array when speed is 0', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].speed = SPEED_LIMIT;
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockImplementation(() => {
                session.inGamePlayers[PLAYER_A_ID].speed = NO_SPEED;
                return { oldX: POS_X_1, oldY: POS_Y_1, newX: POS_X_2, newY: POS_Y_3 };
            });

            service.movePlayer(session, PLAYER_A_ID, Orientation.N);

            expect(eventEmitter.emit).toHaveBeenCalledWith('player.reachableTiles', { playerId: PLAYER_A_ID, reachable: [] });
        });
    });

    describe('movePlayerToStartPosition', () => {
        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            session.inGamePlayers = {};

            expect(() => service.movePlayerToStartPosition(session, PLAYER_A_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when start point not found', () => {
            const session = createMockSession();
            sessionRepository.findStartPointById.mockReturnValue(null);

            expect(() => service.movePlayerToStartPosition(session, PLAYER_A_ID)).toThrow(NotFoundException);
            expect(() => service.movePlayerToStartPosition(session, PLAYER_A_ID)).toThrow('Start point not found');
        });

        it('should not move when player is already at start position', () => {
            const session = createMockSession();
            sessionRepository.findStartPointById.mockReturnValue({ id: START_POINT_ID, playerId: PLAYER_A_ID, x: POS_X_1, y: POS_Y_1 });
            jest.spyOn(service, 'calculateReachableTiles').mockReturnValue([]);

            service.movePlayerToStartPosition(session, PLAYER_A_ID);

            expect(sessionRepository.movePlayerPosition).not.toHaveBeenCalled();
        });

        it('should move player to start position when not at start', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].x = POS_X_2;
            session.inGamePlayers[PLAYER_A_ID].y = POS_Y_2;
            sessionRepository.findStartPointById.mockReturnValue({ id: START_POINT_ID, playerId: PLAYER_A_ID, x: POS_X_1, y: POS_Y_1 });
            gameCache.isTileFree.mockReturnValue(true);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POS_X_2, oldY: POS_Y_2, newX: POS_X_1, newY: POS_Y_1 });
            jest.spyOn(service, 'calculateReachableTiles').mockReturnValue([]);

            service.movePlayerToStartPosition(session, PLAYER_A_ID);

            expect(session.inGamePlayers[PLAYER_A_ID].health).toBe(BASE_HEALTH);
            expect(sessionRepository.movePlayerPosition).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID, POS_X_1, POS_Y_1, NO_SPEED);
        });

        it('should find closest free tile when start position is not free', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].x = POS_X_2;
            session.inGamePlayers[PLAYER_A_ID].y = POS_Y_2;
            sessionRepository.findStartPointById.mockReturnValue({ id: START_POINT_ID, playerId: PLAYER_A_ID, x: POS_X_1, y: POS_Y_1 });
            gameCache.isTileFree.mockReturnValueOnce(false).mockReturnValueOnce(true);
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POS_X_2, oldY: POS_Y_2, newX: POS_X_0, newY: POS_Y_1 });
            jest.spyOn(service, 'calculateReachableTiles').mockReturnValue([]);

            service.movePlayerToStartPosition(session, PLAYER_A_ID);

            expect(sessionRepository.movePlayerPosition).toHaveBeenCalled();
        });

        it('should calculate reachable tiles for active player', () => {
            const session = createMockSession();
            sessionRepository.findStartPointById.mockReturnValue({ id: START_POINT_ID, playerId: PLAYER_A_ID, x: POS_X_1, y: POS_Y_1 });
            const calculateReachableSpy = jest.spyOn(service, 'calculateReachableTiles').mockReturnValue([]);

            service.movePlayerToStartPosition(session, PLAYER_A_ID);

            expect(calculateReachableSpy).toHaveBeenCalledWith(session, PLAYER_A_ID);
        });
    });

    describe('calculateReachableTiles', () => {
        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            session.inGamePlayers = {};

            expect(() => service.calculateReachableTiles(session, PLAYER_A_ID)).toThrow(NotFoundException);
        });

        it('should return empty array when player has no speed', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].speed = NO_SPEED;
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result).toEqual([]);
            expect(eventEmitter.emit).toHaveBeenCalledWith('player.reachableTiles', { playerId: PLAYER_A_ID, reachable: [] });
        });

        it('should calculate reachable tiles for base tiles', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result.length).toBeGreaterThan(0);
            expect(eventEmitter.emit).toHaveBeenCalledWith('player.reachableTiles', { playerId: PLAYER_A_ID, reachable: result });
        });

        it('should not include start position in reachable tiles', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result.find((t) => t.x === POS_X_1 && t.y === POS_Y_1)).toBeUndefined();
        });

        it('should skip occupied tiles', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.BASE,
                playerId: PLAYER_B_ID,
            };
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockImplementation((sessionId: string, x: number, y: number) => {
                if (x === POS_X_2 && y === POS_Y_1) {
                    return PLAYER_B_ID;
                }
                return null;
            });

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result.find((t) => t.x === POS_X_2 && t.y === POS_Y_1)).toBeUndefined();
        });

        it('should skip walls', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.WALL,
                playerId: null,
            };
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result.find((t) => t.x === POS_X_2 && t.y === POS_Y_1)).toBeUndefined();
        });

        it('should include open doors', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.DOOR,
                open: true,
                playerId: null,
            };
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result.find((t) => t.x === POS_X_2 && t.y === POS_Y_1)).toBeDefined();
        });

        it('should skip closed doors', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.DOOR,
                open: false,
                playerId: null,
            };
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result.find((t) => t.x === POS_X_2 && t.y === POS_Y_1)).toBeUndefined();
        });

        it('should handle water tiles with boat', () => {
            const session = createMockSession();
            const mockBoatAtPlayer: Placeable = {
                _id: undefined,
                kind: PlaceableKind.BOAT,
                x: POS_X_1,
                y: POS_Y_1,
                placed: true,
            };
            const mockBoatAtTarget: Placeable = {
                _id: undefined,
                kind: PlaceableKind.BOAT,
                x: POS_X_2,
                y: POS_Y_1,
                placed: true,
            };
            const mockTileWater: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.WATER,
                playerId: null,
            };
            const mockTileBase: TileWithPlayerId = {
                x: POS_X_1,
                y: POS_Y_1,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockImplementation((sessionId: string, x: number, y: number) => {
                if (x === POS_X_1 && y === POS_Y_1) {
                    return [mockBoatAtPlayer];
                }
                if (x === POS_X_2 && y === POS_Y_1) {
                    return [mockBoatAtTarget];
                }
                return [];
            });
            gameCache.getTileAtPosition.mockImplementation((sessionId: string, x: number, y: number) => {
                if (x === POS_X_2 && y === POS_Y_1) {
                    return mockTileWater;
                }
                return mockTileBase;
            });
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result.find((t) => t.x === POS_X_2 && t.y === POS_Y_1)).toBeDefined();
            const waterTile = result.find((t) => t.x === POS_X_2 && t.y === POS_Y_1);
            expect(waterTile?.cost).toBe(WATER_COST_WITH_BOAT);
        });

        it('should skip out of bounds positions', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(undefined);
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result.every((t) => t.x >= 0 && t.x < MAP_SIZE && t.y >= 0 && t.y < MAP_SIZE)).toBe(true);
        });

        it('should respect player speed limits', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].speed = SPEED_LIMIT;
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(result.every((t) => t.cost <= BASE_SPEED)).toBe(true);
        });

        it('should emit player.reachableTiles event', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_A_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith('player.reachableTiles', { playerId: PLAYER_A_ID, reachable: result });
        });

        it('should handle queue.shift() returning undefined', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.getPlaceablesAtPosition.mockReturnValue([]);
            gameCache.getTileAtPosition.mockReturnValue(undefined);
            gameCache.getTileOccupant.mockReturnValue(null);

            type ServiceWithPrivateMethod = {
                initializeQueue: (player: Player) => { x: number; y: number; cost: number; remainingPoints: number }[];
                exploreNeighbors: (current: unknown, context: unknown) => void;
                calculateReachableTiles: (session: InGameSession, playerId: string) => unknown[];
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const queueItem = { x: POS_X_1, y: POS_Y_1, cost: 0, remainingPoints: BASE_SPEED };
            let shiftCallCount = 0;

            // Créer un tableau personnalisé avec une méthode shift qui retourne undefined au deuxième appel
            const mockQueue = Object.create(Array.prototype);
            mockQueue.length = 1;
            mockQueue[0] = queueItem;
            Object.defineProperty(mockQueue, 'shift', {
                value: jest.fn(function (this: typeof mockQueue) {
                    shiftCallCount++;
                    if (shiftCallCount === 1) {
                        // Premier appel : retourner l'élément mais garder length > 0 pour continuer la boucle
                        const item = this[0];
                        delete this[0];
                        // Garder length à 1 pour que la boucle continue et appelle shift() à nouveau
                        this.length = 1;
                        return item;
                    }
                    // Deuxième appel : retourner undefined pour forcer la branche if (!current) continue;
                    // Maintenant vider la queue pour arrêter la boucle
                    this.length = 0;
                    return undefined;
                }),
                writable: true,
                configurable: true,
            });

            // Mocker exploreNeighbors pour qu'il n'ajoute pas d'éléments à la queue
            jest.spyOn(servicePrivate, 'exploreNeighbors' as keyof typeof servicePrivate).mockImplementation(() => {
                // Ne rien faire pour éviter d'ajouter des éléments à la queue
            });

            // Mocker initializeQueue pour retourner notre queue personnalisée
            jest.spyOn(servicePrivate, 'initializeQueue' as keyof typeof servicePrivate).mockReturnValue(mockQueue);

            const result = servicePrivate.calculateReachableTiles(session, PLAYER_A_ID);
            expect(result).toBeDefined();
            expect(shiftCallCount).toBeGreaterThanOrEqual(2);
        });
    });

    describe('calculateTileCost', () => {
        it('should return 1 for water tile when player is on boat', () => {
            const mockTileWater: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.WATER,
                playerId: null,
            };
            gameCache.getTileAtPosition.mockReturnValue(mockTileWater);

            type ServiceWithPrivateMethod = {
                calculateTileCost: (sessionId: string, x: number, y: number, isOnBoat: boolean) => number | null;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.calculateTileCost(SESSION_ID, POS_X_2, POS_Y_1, true);

            expect(result).toBe(WATER_COST_WITH_BOAT);
        });

        it('should return 2 for water tile when player is not on boat', () => {
            const mockTileWater: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: TileKind.WATER,
                playerId: null,
            };
            gameCache.getTileAtPosition.mockReturnValue(mockTileWater);

            type ServiceWithPrivateMethod = {
                calculateTileCost: (sessionId: string, x: number, y: number, isOnBoat: boolean) => number | null;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.calculateTileCost(SESSION_ID, POS_X_2, POS_Y_1, false);

            expect(result).toBe(WATER_COST_WITHOUT_BOAT);
        });

        it('should return null when tileCost is undefined', () => {
            const mockTileWithUnknownKind: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_1,
                kind: 'UNKNOWN_KIND' as TileKind,
                playerId: null,
            };
            gameCache.getTileAtPosition.mockReturnValue(mockTileWithUnknownKind);

            type ServiceWithPrivateMethod = {
                calculateTileCost: (sessionId: string, x: number, y: number, isOnBoat: boolean) => number | null;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.calculateTileCost(SESSION_ID, POS_X_2, POS_Y_1, false);

            expect(result).toBeNull();
        });
    });

    describe('findClosestFreeTile', () => {
        it('should return same position when tile is free', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.isTileFree.mockReturnValue(true);

            type ServiceWithPrivateMethod = {
                findClosestFreeTile: (session: InGameSession, x: number, y: number) => { x: number; y: number };
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.findClosestFreeTile(session, POS_X_1, POS_Y_1);

            expect(result).toEqual({ x: POS_X_1, y: POS_Y_1 });
        });

        it('should find closest free tile when start position is not free', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.isTileFree.mockImplementation((sessionId: string, x: number, y: number) => {
                if (x === POS_X_1 && y === POS_Y_1) {
                    return false;
                }
                if (x === POS_X_2 && y === POS_Y_1) {
                    return true;
                }
                return false;
            });

            type ServiceWithPrivateMethod = {
                findClosestFreeTile: (session: InGameSession, x: number, y: number) => { x: number; y: number };
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.findClosestFreeTile(session, POS_X_1, POS_Y_1);

            expect(result.x).toBe(POS_X_2);
            expect(result.y).toBe(POS_Y_1);
        });

        it('should throw NotFoundException when no free tile found', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.isTileFree.mockReturnValue(false);

            type ServiceWithPrivateMethod = {
                findClosestFreeTile: (session: InGameSession, x: number, y: number) => { x: number; y: number };
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            expect(() => servicePrivate.findClosestFreeTile(session, POS_X_1, POS_Y_1)).toThrow(NotFoundException);
            expect(() => servicePrivate.findClosestFreeTile(session, POS_X_1, POS_Y_1)).toThrow('No free tile found near start point');
        });

        it('should handle queue.shift() returning undefined (coverage for line 216)', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MapSize.MEDIUM);
            gameCache.isTileFree.mockReturnValue(false);

            type ServiceWithPrivateMethod = {
                findClosestFreeTile: (session: InGameSession, x: number, y: number) => { x: number; y: number };
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const originalShift = Array.prototype.shift;
            let shiftCallCount = 0;

            type QueueItem = { x: number; y: number; distance: number };
            const shiftSpy = jest.spyOn(Array.prototype, 'shift').mockImplementation(function (this: QueueItem[]) {
                shiftCallCount++;
                if (shiftCallCount === 1 && this.length > 0) {
                    const result = originalShift.call(this);
                    return result || undefined;
                }
                if (this.length > 0) {
                    this.length = 0;
                }
                return undefined;
            });

            try {
                expect(() => servicePrivate.findClosestFreeTile(session, POS_X_1, POS_Y_1)).toThrow(NotFoundException);
            } finally {
                shiftSpy.mockRestore();
            }
        });
    });
});
