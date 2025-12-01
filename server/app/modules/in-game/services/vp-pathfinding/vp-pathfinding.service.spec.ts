/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { PathNode } from '@app/interfaces/vp-pathfinding-internal.interface';
import { EnemyPosition } from '@app/interfaces/vp-pathfinding.interface';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileCost, TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { VPPathfindingService } from './vp-pathfinding.service';

describe('VPPathfindingService', () => {
    let service: VPPathfindingService;
    let gameCache: jest.Mocked<GameCacheService>;

    const SESSION_ID = 'session-123';
    const VP_PLAYER_ID = 'vp-player-1';
    const POSITION_X_1 = 5;
    const POSITION_Y_1 = 10;
    const POSITION_X_2 = 7;
    const POSITION_Y_2 = 12;
    const MAP_SIZE = 15;
    const BOAT_ID = 'boat-123';
    const ZERO = 0;
    const ONE = 1;
    const TWO = 2;
    const THREE = 3;
    const FOUR = 4;

    const createMockPosition = (overrides: Partial<Position> = {}): Position => ({
        x: POSITION_X_1,
        y: POSITION_Y_1,
        ...overrides,
    });

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: VP_PLAYER_ID,
        name: 'VP Player',
        avatar: null,
        isAdmin: false,
        baseHealth: 100,
        healthBonus: ZERO,
        health: 100,
        maxHealth: 100,
        baseSpeed: THREE,
        speedBonus: ZERO,
        speed: THREE,
        boatSpeedBonus: ZERO,
        boatSpeed: ZERO,
        baseAttack: 10,
        attackBonus: ZERO,
        baseDefense: 5,
        defenseBonus: ZERO,
        attackDice: null,
        defenseDice: null,
        x: POSITION_X_1,
        y: POSITION_Y_1,
        isInGame: true,
        startPointId: '',
        actionsRemaining: ONE,
        combatCount: ZERO,
        combatWins: ZERO,
        combatLosses: ZERO,
        combatDraws: ZERO,
        hasCombatBonus: false,
        ...overrides,
    });

    const createMockTile = (overrides: Partial<{ kind: TileKind; open: boolean; x: number; y: number; playerId: string | null }> = {}): {
        kind: TileKind;
        open: boolean;
        x: number;
        y: number;
        playerId: string | null;
    } => ({
        kind: TileKind.BASE,
        open: false,
        x: POSITION_X_1,
        y: POSITION_Y_1,
        playerId: null,
        ...overrides,
    });

    const createMockPlaceable = (overrides: Partial<Placeable> = {}): Placeable => {
        const mockObjectId = new Types.ObjectId();
        Object.defineProperty(mockObjectId, 'toString', {
            value: jest.fn().mockReturnValue('placeable-id'),
            writable: true,
        });
        return {
            _id: mockObjectId,
            kind: PlaceableKind.HEAL,
            x: POSITION_X_1,
            y: POSITION_Y_1,
            placed: true,
            ...overrides,
        };
    };

    const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: SESSION_ID,
        inGameId: 'in-game-123',
        gameId: 'game-123',
        chatId: 'chat-123',
        maxPlayers: FOUR,
        mode: GameMode.CLASSIC,
        isGameStarted: true,
        inGamePlayers: {
            [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
        },
        teams: {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- Team number must be numeric
            1: { number: ONE, playerIds: [VP_PLAYER_ID] },
        },
        currentTurn: { turnNumber: ONE, activePlayerId: VP_PLAYER_ID, hasUsedAction: false },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        turnOrder: [VP_PLAYER_ID],
        playerCount: ONE,
        ...overrides,
    });

    beforeEach(async () => {
        const mockGameCache = {
            getMapSize: jest.fn(),
            getTileAtPosition: jest.fn(),
            getTileOccupant: jest.fn(),
            getPlaceableAtPosition: jest.fn(),
            getTeleportDestination: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VPPathfindingService,
                {
                    provide: GameCacheService,
                    useValue: mockGameCache,
                },
            ],
        }).compile();

        service = module.get<VPPathfindingService>(VPPathfindingService);
        gameCache = module.get(GameCacheService);
    });

    describe('findPath', () => {
        it('should return empty result when player is missing', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });
            const destination = createMockPosition();

            const result = service.findPath(session, VP_PLAYER_ID, destination);

            expect(result.reachable).toBe(false);
            expect(result.destination).toEqual(destination);
        });

        it('should return zero cost path when start equals destination', () => {
            const session = createMockSession();
            const destination = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });

            const result = service.findPath(session, VP_PLAYER_ID, destination);

            expect(result.reachable).toBe(true);
            expect(result.totalCost).toBe(ZERO);
            expect(result.actionsRequired).toBe(ZERO);
            expect(result.actions.length).toBe(ZERO);
        });

        it('should find path using A* algorithm', () => {
            const session = createMockSession();
            const destination = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.BASE }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service.findPath(session, VP_PLAYER_ID, destination);

            expect(result).toBeDefined();
        });

        it('should handle player on boat', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, onBoatId: BOAT_ID }),
                },
            });
            const destination = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.WATER }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service.findPath(session, VP_PLAYER_ID, destination);

            expect(result).toBeDefined();
        });
    });

    describe('aStarPathfinding', () => {
        it('should return unreachable result when no path found', () => {
            const session = createMockSession();
            const start = createMockPosition();
            const goal = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(null);

            const result = service['aStarPathfinding'](session, start, goal, false);

            expect(result.reachable).toBe(false);
        });

        it('should find path when goal is reachable', () => {
            const session = createMockSession();
            const start = createMockPosition();
            const goal = createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.BASE }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service['aStarPathfinding'](session, start, goal, false);

            expect(result.reachable).toBe(true);
        });

        it('should update existing node when better path found', () => {
            const session = createMockSession();
            const start = createMockPosition();
            const goal = createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.BASE }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service['aStarPathfinding'](session, start, goal, false);

            expect(result.reachable).toBe(true);
        });
    });

    describe('getNeighbors', () => {
        it('should skip invalid positions', () => {
            const session = createMockSession();
            const current = {
                position: createMockPosition({ x: ZERO, y: ZERO }),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const context = { session, mapSize: MAP_SIZE, goal: createMockPosition() };
            gameCache.getTileAtPosition.mockReturnValue(null);

            const result = service['getNeighbors'](current, context);

            expect(result.length).toBe(ZERO);
        });

        it('should skip wall tiles', () => {
            const session = createMockSession();
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const context = { session, mapSize: MAP_SIZE, goal: createMockPosition() };
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.WALL }));

            const result = service['getNeighbors'](current, context);

            expect(result.length).toBe(ZERO);
        });

        it('should skip occupied tiles unless goal', () => {
            const session = createMockSession();
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const goal = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            const context = { session, mapSize: MAP_SIZE, goal };
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getTileOccupant.mockReturnValue('other-player');
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service['getNeighbors'](current, context);

            expect(result.length).toBe(ZERO);
        });

        it('should allow occupied tile when it is goal', () => {
            const session = createMockSession();
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const goal = createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 });
            const context = { session, mapSize: MAP_SIZE, goal };
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ x: goal.x, y: goal.y }));
            gameCache.getTileOccupant.mockReturnValue('other-player');
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service['getNeighbors'](current, context);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should skip blocking placeables', () => {
            const session = createMockSession();
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const context = { session, mapSize: MAP_SIZE, goal: createMockPosition() };
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getPlaceableAtPosition.mockReturnValue(createMockPlaceable({ kind: PlaceableKind.HEAL }));

            const result = service['getNeighbors'](current, context);

            expect(result.length).toBe(ZERO);
        });

        it('should add boat neighbors when on boat', () => {
            const session = createMockSession();
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: true,
                actionsUsed: ZERO,
            };
            const context = { session, mapSize: MAP_SIZE, goal: createMockPosition() };
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.WATER }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service['getNeighbors'](current, context);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should add walking neighbors when not on boat', () => {
            const session = createMockSession();
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const context = { session, mapSize: MAP_SIZE, goal: createMockPosition() };
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.BASE }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service['getNeighbors'](current, context);

            expect(result.length).toBeGreaterThan(ZERO);
        });
    });

    describe('addBoatNeighbors', () => {
        it('should add move neighbor for water tile', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: true,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.WATER }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };

            service['addBoatNeighbors'](neighbors, exp);

            expect(neighbors.length).toBe(ONE);
            expect(neighbors[ZERO].isOnBoat).toBe(true);
        });

        it('should add disembark neighbor for base tile', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: true,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.BASE }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };

            service['addBoatNeighbors'](neighbors, exp);

            expect(neighbors.length).toBe(ONE);
            expect(neighbors[ZERO].isOnBoat).toBe(false);
        });

        it('should add disembark neighbor for open door', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: true,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.DOOR, open: true }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };

            service['addBoatNeighbors'](neighbors, exp);

            expect(neighbors.length).toBe(ONE);
        });
    });

    describe('addWalkingNeighbors', () => {
        it('should handle door tile', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.DOOR }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();

            service['addWalkingNeighbors'](neighbors, exp, session);

            expect(neighbors.length).toBeGreaterThan(ZERO);
        });

        it('should handle teleport tile', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.TELEPORT }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();
            gameCache.getTeleportDestination.mockReturnValue(createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 }));
            gameCache.getTileOccupant.mockReturnValue(null);

            service['addWalkingNeighbors'](neighbors, exp, session);

            expect(neighbors.length).toBeGreaterThan(ZERO);
        });

        it('should handle base tile', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.BASE }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();

            service['addWalkingNeighbors'](neighbors, exp, session);

            expect(neighbors.length).toBeGreaterThan(ZERO);
        });

        it('should add boat boarding option for water tile', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.WATER }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();
            gameCache.getPlaceableAtPosition.mockReturnValue(createMockPlaceable({ kind: PlaceableKind.BOAT }));

            service['addWalkingNeighbors'](neighbors, exp, session);

            expect(neighbors.length).toBeGreaterThan(ZERO);
        });
    });

    describe('addDoorNeighbor', () => {
        it('should add move action for open door', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.DOOR, open: true }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };

            service['addDoorNeighbor'](neighbors, exp);

            expect(neighbors.length).toBe(ONE);
        });

        it('should add openDoor action for closed door', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.DOOR, open: false }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };

            service['addDoorNeighbor'](neighbors, exp);

            expect(neighbors.length).toBe(ONE);
            expect(neighbors[ZERO].actionsUsed).toBe(ONE);
        });
    });

    describe('addTeleportNeighbor', () => {
        it('should return early when tile cost is null', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.WALL }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();

            service['addTeleportNeighbor'](neighbors, exp, session);

            expect(neighbors.length).toBe(ZERO);
        });

        it('should skip when destination is occupied', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const goal = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.TELEPORT }),
                orientation: Orientation.N,
                goal,
            };
            const session = createMockSession();
            gameCache.getTeleportDestination.mockReturnValue(createMockPosition({ x: POSITION_X_1 + TWO, y: POSITION_Y_1 }));
            gameCache.getTileOccupant.mockReturnValue('other-player');

            service['addTeleportNeighbor'](neighbors, exp, session);

            expect(neighbors.length).toBe(ZERO);
        });

        it('should add teleport neighbor when valid', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.TELEPORT }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();
            const destination = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            gameCache.getTeleportDestination.mockReturnValue(destination);
            gameCache.getTileOccupant.mockReturnValue(null);

            service['addTeleportNeighbor'](neighbors, exp, session);

            expect(neighbors.length).toBe(ONE);
            expect(neighbors[ZERO].position).toEqual(destination);
        });

        it('should return early when getTeleportDestination throws', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.TELEPORT }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();
            gameCache.getTeleportDestination.mockImplementation(() => {
                throw new Error('Test error');
            });

            service['addTeleportNeighbor'](neighbors, exp, session);

            expect(neighbors.length).toBe(ZERO);
        });
    });

    describe('addBoatBoardingOption', () => {
        it('should return early when tile is not water', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.BASE }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();

            service['addBoatBoardingOption'](neighbors, exp, session);

            expect(neighbors.length).toBe(ZERO);
        });

        it('should add boardBoat neighbor when boat is present', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.WATER }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();
            gameCache.getPlaceableAtPosition.mockReturnValue(createMockPlaceable({ kind: PlaceableKind.BOAT }));

            service['addBoatBoardingOption'](neighbors, exp, session);

            expect(neighbors.length).toBe(ONE);
            expect(neighbors[ZERO].isOnBoat).toBe(true);
        });

        it('should not add neighbor when no boat', () => {
            const neighbors: PathNode[] = [];
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const exp = {
                current,
                nextPos: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                tile: createMockTile({ kind: TileKind.WATER }),
                orientation: Orientation.N,
                goal: createMockPosition(),
            };
            const session = createMockSession();
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            service['addBoatBoardingOption'](neighbors, exp, session);

            expect(neighbors.length).toBe(ZERO);
        });
    });

    describe('createNeighborNode', () => {
        it('should create neighbor node with correct properties', () => {
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const params = {
                current,
                position: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                moveCost: ONE,
                orientation: Orientation.N,
                actionType: 'move' as const,
                isOnBoat: false,
                goal: createMockPosition(),
            };

            const result = service['createNeighborNode'](params);

            expect(result.position).toEqual(params.position);
            expect(result.costFromStart).toBe(ONE);
            expect(result.isOnBoat).toBe(false);
        });

        it('should add extraActions when provided', () => {
            const current = {
                position: createMockPosition(),
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const params = {
                current,
                position: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                moveCost: ONE,
                orientation: Orientation.N,
                actionType: 'openDoor' as const,
                isOnBoat: false,
                goal: createMockPosition(),
                extraActions: ONE,
            };

            const result = service['createNeighborNode'](params);

            expect(result.actionsUsed).toBe(ONE);
        });
    });

    describe('isValidPosition', () => {
        it('should return true for valid position', () => {
            const pos = createMockPosition({ x: ONE, y: ONE });
            const mapSize = MAP_SIZE;

            const result = service['isValidPosition'](pos, mapSize);

            expect(result).toBe(true);
        });

        it('should return false for negative x', () => {
            const pos = createMockPosition({ x: -ONE, y: ONE });
            const mapSize = MAP_SIZE;

            const result = service['isValidPosition'](pos, mapSize);

            expect(result).toBe(false);
        });

        it('should return false for x >= mapSize', () => {
            const pos = createMockPosition({ x: MAP_SIZE, y: ONE });
            const mapSize = MAP_SIZE;

            const result = service['isValidPosition'](pos, mapSize);

            expect(result).toBe(false);
        });

        it('should return false for negative y', () => {
            const pos = createMockPosition({ x: ONE, y: -ONE });
            const mapSize = MAP_SIZE;

            const result = service['isValidPosition'](pos, mapSize);

            expect(result).toBe(false);
        });

        it('should return false for y >= mapSize', () => {
            const pos = createMockPosition({ x: ONE, y: MAP_SIZE });
            const mapSize = MAP_SIZE;

            const result = service['isValidPosition'](pos, mapSize);

            expect(result).toBe(false);
        });
    });

    describe('hasBlockingPlaceable', () => {
        it('should return false when no placeable', () => {
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service['hasBlockingPlaceable'](SESSION_ID, createMockPosition());

            expect(result).toBe(false);
        });

        it('should return true for heal sanctuary', () => {
            gameCache.getPlaceableAtPosition.mockReturnValue(createMockPlaceable({ kind: PlaceableKind.HEAL }));

            const result = service['hasBlockingPlaceable'](SESSION_ID, createMockPosition());

            expect(result).toBe(true);
        });

        it('should return true for fight sanctuary', () => {
            gameCache.getPlaceableAtPosition.mockReturnValue(createMockPlaceable({ kind: PlaceableKind.FIGHT }));

            const result = service['hasBlockingPlaceable'](SESSION_ID, createMockPosition());

            expect(result).toBe(true);
        });

        it('should return false for boat', () => {
            gameCache.getPlaceableAtPosition.mockReturnValue(createMockPlaceable({ kind: PlaceableKind.BOAT }));

            const result = service['hasBlockingPlaceable'](SESSION_ID, createMockPosition());

            expect(result).toBe(false);
        });
    });

    describe('getTileCost', () => {
        it('should return BASE cost for BASE tile', () => {
            const result = service['getTileCost'](TileKind.BASE);

            expect(result).toBe(TileCost.BASE);
        });

        it('should return ICE cost for ICE tile', () => {
            const result = service['getTileCost'](TileKind.ICE);

            expect(result).toBe(TileCost.ICE);
        });

        it('should return WATER cost for WATER tile', () => {
            const result = service['getTileCost'](TileKind.WATER);

            expect(result).toBe(TileCost.WATER);
        });

        it('should return TELEPORT cost for TELEPORT tile', () => {
            const result = service['getTileCost'](TileKind.TELEPORT);

            expect(result).toBe(TileCost.TELEPORT);
        });

        it('should return null for DOOR tile', () => {
            const result = service['getTileCost'](TileKind.DOOR);

            expect(result).toBeNull();
        });

        it('should return null for WALL tile', () => {
            const result = service['getTileCost'](TileKind.WALL);

            expect(result).toBeNull();
        });
    });

    describe('heuristic', () => {
        it('should calculate Manhattan distance', () => {
            const a = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const b = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });

            const result = service['heuristic'](a, b);

            expect(result).toBe(Math.abs(POSITION_X_1 - POSITION_X_2) + Math.abs(POSITION_Y_1 - POSITION_Y_2));
        });

        it('should return zero for same position', () => {
            const a = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const b = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });

            const result = service['heuristic'](a, b);

            expect(result).toBe(ZERO);
        });
    });

    describe('getNodeKey', () => {
        it('should generate key with position and boat status', () => {
            const position = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const isOnBoat = true;

            const result = service['getNodeKey'](position, isOnBoat);

            expect(result).toBe(`${POSITION_X_1},${POSITION_Y_1},true`);
        });

        it('should generate key with false boat status', () => {
            const position = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const isOnBoat = false;

            const result = service['getNodeKey'](position, isOnBoat);

            expect(result).toBe(`${POSITION_X_1},${POSITION_Y_1},false`);
        });
    });

    describe('reconstructPath', () => {
        it('should reconstruct path from end node', () => {
            const destination = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            const parent = {
                position: createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 }),
                costFromStart: ONE,
                estimatedCostToGoal: ZERO,
                totalCost: ONE,
                parent: null,
                actionToReach: {
                    type: 'move' as const,
                    orientation: Orientation.N,
                    position: createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 }),
                },
                isOnBoat: false,
                actionsUsed: ZERO,
            };
            const endNode = {
                position: destination,
                costFromStart: TWO,
                estimatedCostToGoal: ZERO,
                totalCost: TWO,
                parent,
                actionToReach: { type: 'move' as const, orientation: Orientation.N, position: destination },
                isOnBoat: false,
                actionsUsed: ZERO,
            };

            const result = service['reconstructPath'](endNode, destination);

            expect(result.reachable).toBe(true);
            expect(result.totalCost).toBe(TWO);
            expect(result.actions.length).toBeGreaterThan(ZERO);
        });

        it('should handle node with no parent', () => {
            const destination = createMockPosition();
            const endNode = {
                position: destination,
                costFromStart: ZERO,
                estimatedCostToGoal: ZERO,
                totalCost: ZERO,
                parent: null,
                actionToReach: null,
                isOnBoat: false,
                actionsUsed: ZERO,
            };

            const result = service['reconstructPath'](endNode, destination);

            expect(result.reachable).toBe(true);
            expect(result.actions.length).toBe(ZERO);
        });
    });

    describe('expandDoorActions', () => {
        it('should expand openDoor action to openDoor and move', () => {
            const rawActions = [
                { type: 'openDoor' as const, orientation: Orientation.N, position: createMockPosition() },
            ];

            const result = service['expandDoorActions'](rawActions);

            expect(result.length).toBe(TWO);
            expect(result[ZERO].type).toBe('openDoor');
            expect(result[ONE].type).toBe('move');
        });

        it('should keep non-door actions unchanged', () => {
            const rawActions = [
                { type: 'move' as const, orientation: Orientation.N, position: createMockPosition() },
            ];

            const result = service['expandDoorActions'](rawActions);

            expect(result.length).toBe(ONE);
            expect(result[ZERO].type).toBe('move');
        });

        it('should handle mixed actions', () => {
            const rawActions = [
                { type: 'move' as const, orientation: Orientation.N, position: createMockPosition() },
                { type: 'openDoor' as const, orientation: Orientation.E, position: createMockPosition({ x: POSITION_X_1 + ONE }) },
                { type: 'teleport' as const, orientation: Orientation.S, position: createMockPosition({ y: POSITION_Y_1 + ONE }) },
            ];

            const result = service['expandDoorActions'](rawActions);

            expect(result.length).toBe(FOUR);
        });
    });

    describe('createEmptyResult', () => {
        it('should create unreachable result', () => {
            const destination = createMockPosition();

            const result = service['createEmptyResult'](destination);

            expect(result.reachable).toBe(false);
            expect(result.totalCost).toBe(Infinity);
            expect(result.actionsRequired).toBe(ZERO);
            expect(result.actions.length).toBe(ZERO);
            expect(result.destination).toEqual(destination);
        });
    });

    describe('findBestEscapePoint', () => {
        it('should return null when player is missing', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });
            const enemies: EnemyPosition[] = [];

            const result = service.findBestEscapePoint(session, VP_PLAYER_ID, enemies);

            expect(result).toBeNull();
        });

        it('should return best escape point when found', () => {
            const session = createMockSession();
            const enemies: EnemyPosition[] = [
                { position: createMockPosition({ x: POSITION_X_1 + THREE, y: POSITION_Y_1 }) },
            ];
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.BASE }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service.findBestEscapePoint(session, VP_PLAYER_ID, enemies);

            expect(result).toBeDefined();
        });

        it('should return fallback escape point when no better found', () => {
            const session = createMockSession();
            const enemies: EnemyPosition[] = [
                { position: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }) },
            ];
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.BASE }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            const result = service.findBestEscapePoint(session, VP_PLAYER_ID, enemies);

            expect(result).toBeDefined();
        });

        it('should skip current position', () => {
            const session = createMockSession();
            const enemies: EnemyPosition[] = [];
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            const result = service.findBestEscapePoint(session, VP_PLAYER_ID, enemies);

            expect(result).toBeNull();
        });

        it('should skip unreachable paths', () => {
            const session = createMockSession();
            const enemies: EnemyPosition[] = [
                { position: createMockPosition({ x: POSITION_X_1 + THREE, y: POSITION_Y_1 }) },
            ];
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(null);

            const result = service.findBestEscapePoint(session, VP_PLAYER_ID, enemies);

            expect(result).toBeNull();
        });
    });

    describe('getSampleEscapePositions', () => {
        it('should generate sample positions', () => {
            const mapSize = MAP_SIZE;
            const playerPos = createMockPosition({ x: MAP_SIZE / TWO, y: MAP_SIZE / TWO });
            const enemies: EnemyPosition[] = [
                { position: createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 }) },
            ];

            const result = service['getSampleEscapePositions'](mapSize, playerPos, enemies);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should filter positions within bounds', () => {
            const mapSize = MAP_SIZE;
            const playerPos = createMockPosition({ x: ONE, y: ONE });
            const enemies: EnemyPosition[] = [
                { position: createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 }) },
            ];

            const result = service['getSampleEscapePositions'](mapSize, playerPos, enemies);

            result.forEach((pos) => {
                expect(pos.x).toBeGreaterThanOrEqual(ONE);
                expect(pos.x).toBeLessThan(mapSize - ONE);
                expect(pos.y).toBeGreaterThanOrEqual(ONE);
                expect(pos.y).toBeLessThan(mapSize - ONE);
            });
        });
    });

    describe('calculateMinDistanceFromEnemies', () => {
        it('should return Infinity when no enemies', () => {
            const position = createMockPosition();
            const enemies: EnemyPosition[] = [];

            const result = service['calculateMinDistanceFromEnemies'](position, enemies);

            expect(result).toBe(Infinity);
        });

        it('should calculate minimum distance from enemies', () => {
            const position = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const enemies: EnemyPosition[] = [
                { position: createMockPosition({ x: POSITION_X_1 + THREE, y: POSITION_Y_1 }) },
                { position: createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 }) },
            ];

            const result = service['calculateMinDistanceFromEnemies'](position, enemies);

            expect(result).toBe(ONE);
        });

        it('should handle single enemy', () => {
            const position = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const enemies: EnemyPosition[] = [
                { position: createMockPosition({ x: POSITION_X_1 + TWO, y: POSITION_Y_1 + TWO }) },
            ];

            const result = service['calculateMinDistanceFromEnemies'](position, enemies);

            expect(result).toBe(FOUR);
        });
    });
});

