/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { PathActionType } from '@app/enums/path-action-type.enum';
import { PointOfInterestType } from '@app/enums/point-of-interest-type.enum';
import { VPConfig } from '@app/interfaces/vp-config.interface';
import { EvaluatedTarget, MapScanWithDistances, PointOfInterestWithPath } from '@app/interfaces/vp-gameplay.interface';
import { PathResult } from '@app/interfaces/vp-pathfinding.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { VPPathfindingService } from '@app/modules/in-game/services/vp-pathfinding/vp-pathfinding.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { StartPoint } from '@common/interfaces/start-point.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { VPCTFService } from './vp-ctf.service';

describe('VPCTFService', () => {
    let service: VPCTFService;
    let pathfindingService: jest.Mocked<VPPathfindingService>;
    let gameCache: jest.Mocked<GameCacheService>;

    const SESSION_ID = 'session-123';
    const VP_PLAYER_ID = 'vp-player-1';
    const FLAG_CARRIER_ID = 'flag-carrier-1';
    const TEAM_1 = 1;
    const TEAM_2 = 2;
    const POSITION_X_1 = 5;
    const POSITION_Y_1 = 10;
    const POSITION_X_2 = 7;
    const POSITION_Y_2 = 12;
    const START_POINT_X = 0;
    const START_POINT_Y = 0;
    const MAP_SIZE = 15;
    const PATH_COST = 5;
    const ZERO = 0;
    const ONE = 1;
    const TWO = 2;
    const THREE = 3;
    const FOUR = 4;
    const BLOCKED_FLAG_CARRIER_ATTACK_PRIORITY = 180;
    const ENEMY_PLAYER_ID = 'enemy-player-1';
    const ADJACENT_ATTACK_BONUS = 20;

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
        teamNumber: TEAM_1,
        ...overrides,
    });

    const createMockPathResult = (overrides: Partial<PathResult> = {}): PathResult => ({
        reachable: true,
        totalCost: PATH_COST,
        actionsRequired: PATH_COST,
        actions: [],
        destination: createMockPosition(),
        ...overrides,
    });

    const createMockVPConfig = (overrides: Partial<VPConfig> = {}): VPConfig => ({
        health: {
            healThreshold: 0.4,
            criticalHealthThreshold: 0.2,
        },
        priorities: {
            attack: 100,
            heal: 80,
            fightSanctuary: 60,
            flag: 150,
            escape: 50,
        },
        distanceWeights: {
            attackPenaltyPerTile: 2,
            healPenaltyPerTile: 1,
            fightSanctuaryPenaltyPerTile: 1,
            flagPenaltyPerTile: 3,
        },
        bonuses: {
            adjacentAttackBonus: 20,
            lowHealthHealBonus: 30,
            criticalHealthHealBonus: 50,
            noBonusFightSanctuaryBonus: 10,
            escapeWhenEnemyCloseBonus: 15,
        },
        maxDistances: {
            maxHealDistance: 10,
            maxFightSanctuaryDistance: 8,
            maxFlagDistance: 15,
        },
        fightSanctuary: {
            doubleActionRate: 0.5,
        },
        escape: {
            enemyProximityTiles: 3,
            distanceBonusPerTile: 2,
        },
        flag: {
            chaseFlagCarrierPriority: 100,
            guardStartPointPriority: 80,
            chaseFlagCarrierPenaltyPerTile: 2,
            guardStartPointPenaltyPerTile: 1,
            chaseFlagCarrierBonus: 10,
            guardStartPointBonus: 5,
            maxChaseFlagCarrierDistance: 12,
            maxGuardStartPointDistance: 10,
        },
        ...overrides,
    });

    const createMockStartPoint = (overrides: Partial<StartPoint> = {}): StartPoint => ({
        id: 'start-point-1',
        playerId: VP_PLAYER_ID,
        x: START_POINT_X,
        y: START_POINT_Y,
        ...overrides,
    });

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
            [TEAM_1]: { number: TEAM_1, playerIds: [VP_PLAYER_ID] },
            [TEAM_2]: { number: TEAM_2, playerIds: [FLAG_CARRIER_ID] },
        },
        currentTurn: { turnNumber: ONE, activePlayerId: VP_PLAYER_ID, hasUsedAction: false },
        startPoints: [createMockStartPoint()],
        mapSize: MapSize.MEDIUM,
        turnOrder: [VP_PLAYER_ID],
        playerCount: ONE,
        ...overrides,
    });

    beforeEach(async () => {
        const mockPathfindingService = {
            findPath: jest.fn(),
        };

        const mockGameCache = {
            getMapSize: jest.fn(),
            getTileAtPosition: jest.fn(),
            getTileOccupant: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VPCTFService,
                {
                    provide: VPPathfindingService,
                    useValue: mockPathfindingService,
                },
                {
                    provide: GameCacheService,
                    useValue: mockGameCache,
                },
            ],
        }).compile();

        service = module.get<VPCTFService>(VPCTFService);
        pathfindingService = module.get(VPPathfindingService);
        gameCache = module.get(GameCacheService);
    });

    describe('evaluateCTFObjectives', () => {
        it('should return false when flagData is missing', () => {
            const session = createMockSession({ flagData: undefined });
            const pointsWithDistances: MapScanWithDistances = {
                enemies: [],
                healSanctuaries: [],
                fightSanctuaries: [],
                boats: [],
                flags: [],
                all: [],
            };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            const result = service.evaluateCTFObjectives(session, VP_PLAYER_ID, pointsWithDistances, results, config);

            expect(result).toBe(false);
        });

        it('should return false when VP player is missing', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: null },
                inGamePlayers: {},
            });
            const pointsWithDistances: MapScanWithDistances = {
                enemies: [],
                healSanctuaries: [],
                fightSanctuaries: [],
                boats: [],
                flags: [],
                all: [],
            };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            const result = service.evaluateCTFObjectives(session, VP_PLAYER_ID, pointsWithDistances, results, config);

            expect(result).toBe(false);
        });

        it('should evaluate return flag when VP has flag', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: VP_PLAYER_ID },
            });
            const pointsWithDistances: MapScanWithDistances = {
                enemies: [],
                healSanctuaries: [],
                fightSanctuaries: [],
                boats: [],
                flags: [],
                all: [],
            };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            pathfindingService.findPath.mockReturnValue(
                createMockPathResult({ reachable: true, actions: [{ type: PathActionType.MOVE, position: createMockPosition() }] }),
            );

            const result = service.evaluateCTFObjectives(session, VP_PLAYER_ID, pointsWithDistances, results, config);

            expect(result).toBe(true);
            expect(results.length).toBeGreaterThan(ZERO);
        });

        it('should evaluate dropped flag when flag has no holder', () => {
            const flag: PointOfInterestWithPath = {
                type: PointOfInterestType.FLAG,
                position: createMockPosition(),
                path: createMockPathResult(),
                isHeld: false,
            };
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: null },
            });
            const pointsWithDistances: MapScanWithDistances = {
                enemies: [],
                healSanctuaries: [],
                fightSanctuaries: [],
                boats: [],
                flags: [flag],
                all: [],
            };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            const result = service.evaluateCTFObjectives(session, VP_PLAYER_ID, pointsWithDistances, results, config);

            expect(result).toBe(true);
        });

        it('should return false when flag carrier is missing', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: FLAG_CARRIER_ID },
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                },
            });
            const pointsWithDistances: MapScanWithDistances = {
                enemies: [],
                healSanctuaries: [],
                fightSanctuaries: [],
                boats: [],
                flags: [],
                all: [],
            };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            const result = service.evaluateCTFObjectives(session, VP_PLAYER_ID, pointsWithDistances, results, config);

            expect(result).toBe(false);
        });

        it('should return false when flag carrier is on same team', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: FLAG_CARRIER_ID },
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, teamNumber: TEAM_1 }),
                    [FLAG_CARRIER_ID]: createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_1 }),
                },
            });
            const pointsWithDistances: MapScanWithDistances = {
                enemies: [],
                healSanctuaries: [],
                fightSanctuaries: [],
                boats: [],
                flags: [],
                all: [],
            };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            const result = service.evaluateCTFObjectives(session, VP_PLAYER_ID, pointsWithDistances, results, config);

            expect(result).toBe(false);
        });

        it('should evaluate flag carrier when chaseFlagCarrierPriority is greater than zero', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: FLAG_CARRIER_ID },
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, teamNumber: TEAM_1 }),
                    [FLAG_CARRIER_ID]: createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_2, x: POSITION_X_2, y: POSITION_Y_2 }),
                },
            });
            const pointsWithDistances: MapScanWithDistances = {
                enemies: [],
                healSanctuaries: [],
                fightSanctuaries: [],
                boats: [],
                flags: [],
                all: [],
            };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig({
                flag: {
                    chaseFlagCarrierPriority: 100,
                    guardStartPointPriority: ZERO,
                    chaseFlagCarrierPenaltyPerTile: TWO,
                    guardStartPointPenaltyPerTile: ONE,
                    chaseFlagCarrierBonus: 10,
                    guardStartPointBonus: 5,
                    maxChaseFlagCarrierDistance: 12,
                    maxGuardStartPointDistance: 10,
                },
            });
            pathfindingService.findPath.mockReturnValue(createMockPathResult());

            const result = service.evaluateCTFObjectives(session, VP_PLAYER_ID, pointsWithDistances, results, config);

            expect(result).toBe(true);
        });

        it('should evaluate guard point when guardStartPointPriority is greater than zero', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: FLAG_CARRIER_ID },
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, teamNumber: TEAM_1 }),
                    [FLAG_CARRIER_ID]: createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_2 }),
                },
                startPoints: [
                    createMockStartPoint({ playerId: FLAG_CARRIER_ID }),
                ],
            });
            const pointsWithDistances: MapScanWithDistances = {
                enemies: [],
                healSanctuaries: [],
                fightSanctuaries: [],
                boats: [],
                flags: [],
                all: [],
            };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig({
                flag: {
                    chaseFlagCarrierPriority: ZERO,
                    guardStartPointPriority: 80,
                    chaseFlagCarrierPenaltyPerTile: TWO,
                    guardStartPointPenaltyPerTile: ONE,
                    chaseFlagCarrierBonus: 10,
                    guardStartPointBonus: 5,
                    maxChaseFlagCarrierDistance: 12,
                    maxGuardStartPointDistance: 10,
                },
            });
            pathfindingService.findPath.mockReturnValue(createMockPathResult());

            const result = service.evaluateCTFObjectives(session, VP_PLAYER_ID, pointsWithDistances, results, config);

            expect(result).toBe(true);
        });
    });

    describe('evaluateReturnFlag', () => {
        it('should return early when VP player is missing', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: VP_PLAYER_ID },
                inGamePlayers: {},
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            service['evaluateReturnFlag'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should return early when start point is missing', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: VP_PLAYER_ID },
                startPoints: [],
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            service['evaluateReturnFlag'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add return flag target when path is reachable', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: VP_PLAYER_ID },
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            const path = createMockPathResult({ reachable: true, actions: [{ type: PathActionType.MOVE, position: createMockPosition() }] });
            pathfindingService.findPath.mockReturnValue(path);

            service['evaluateReturnFlag'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ONE);
            expect(results[ZERO].type).toBe('returnFlag');
        });

        it('should use findBestPathToAdjacent when direct path is not reachable', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: VP_PLAYER_ID },
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.BASE, open: false, x: POSITION_X_1 + ONE, y: POSITION_Y_1, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath
                .mockReturnValueOnce(createMockPathResult({ reachable: false }))
                .mockReturnValueOnce(
                    createMockPathResult({
                        reachable: true,
                        actions: [{ type: PathActionType.MOVE, position: createMockPosition() }],
                    }),
                )
                .mockReturnValue(createMockPathResult({ reachable: false }));

            service['evaluateReturnFlag'](session, VP_PLAYER_ID, results, config);

            expect(pathfindingService.findPath).toHaveBeenCalled();
        });

        it('should use findClosestReachableTowards when adjacent path is not reachable', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: VP_PLAYER_ID },
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));

            service['evaluateReturnFlag'](session, VP_PLAYER_ID, results, config);

            expect(pathfindingService.findPath).toHaveBeenCalled();
        });

        it('should return early when path has no actions', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: VP_PLAYER_ID },
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, actions: [] }));

            service['evaluateReturnFlag'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should evaluate blocking enemy attack when blocking enemy is found', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: VP_PLAYER_ID },
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: TEAM_2, x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                },
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            service['evaluateReturnFlag'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ONE);
            expect(results[ZERO].type).toBe(PointOfInterestType.ENEMY);
        });

        it('should evaluate adjacent enemies when path is not reachable and has no actions', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: VP_PLAYER_ID },
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: TEAM_2, x: POSITION_X_1 + ONE, y: POSITION_Y_1 }),
                },
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.BASE, open: false, x: POSITION_X_1 + ONE, y: POSITION_Y_1, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            service['evaluateReturnFlag'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBeGreaterThan(ZERO);
        });
    });

    describe('findClosestReachableTowards', () => {
        it('should return unreachable result when player is missing', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });
            const target = createMockPosition();

            const result = service['findClosestReachableTowards'](session, VP_PLAYER_ID, target);

            expect(result.reachable).toBe(false);
        });

        it('should find closest reachable path towards target', () => {
            const session = createMockSession();
            const target = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            pathfindingService.findPath.mockReturnValue(
                createMockPathResult({ reachable: true, actions: [{ type: PathActionType.MOVE, position: createMockPosition() }] }),
            );

            service['findClosestReachableTowards'](session, VP_PLAYER_ID, target);

            expect(pathfindingService.findPath).toHaveBeenCalled();
        });

        it('should return unreachable result when no path found', () => {
            const session = createMockSession();
            const target = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));

            const result = service['findClosestReachableTowards'](session, VP_PLAYER_ID, target);

            expect(result.reachable).toBe(false);
        });
    });

    describe('evaluateDroppedFlag', () => {
        it('should skip flags that are held', () => {
            const flags: PointOfInterestWithPath[] = [
                {
                    type: PointOfInterestType.FLAG,
                    position: createMockPosition(),
                    path: createMockPathResult(),
                    isHeld: true,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            service['evaluateDroppedFlag'](flags, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip flags that are not reachable', () => {
            const flags: PointOfInterestWithPath[] = [
                {
                    type: PointOfInterestType.FLAG,
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: false }),
                    isHeld: false,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            service['evaluateDroppedFlag'](flags, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip flags beyond max distance', () => {
            const flags: PointOfInterestWithPath[] = [
                {
                    type: PointOfInterestType.FLAG,
                    position: createMockPosition(),
                    path: createMockPathResult({ totalCost: 20 }),
                    isHeld: false,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig({ maxDistances: { maxHealDistance: 10, maxFightSanctuaryDistance: 8, maxFlagDistance: 15 } });

            service['evaluateDroppedFlag'](flags, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add dropped flag when conditions are met', () => {
            const flags: PointOfInterestWithPath[] = [
                {
                    type: PointOfInterestType.FLAG,
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: 5 }),
                    isHeld: false,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            service['evaluateDroppedFlag'](flags, results, config);

            expect(results.length).toBe(ONE);
        });
    });

    describe('evaluateFlagCarrier', () => {
        it('should return early when path is not reachable', () => {
            const session = createMockSession();
            const flagCarrier = createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_2 });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));

            service['evaluateFlagCarrier'](session, VP_PLAYER_ID, flagCarrier, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should return early when distance exceeds maxChaseFlagCarrierDistance', () => {
            const session = createMockSession();
            const flagCarrier = createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_2 });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig({
                flag: {
                    chaseFlagCarrierPriority: 100,
                    guardStartPointPriority: ZERO,
                    chaseFlagCarrierPenaltyPerTile: TWO,
                    guardStartPointPenaltyPerTile: ONE,
                    chaseFlagCarrierBonus: 10,
                    guardStartPointBonus: 5,
                    maxChaseFlagCarrierDistance: 5,
                    maxGuardStartPointDistance: 10,
                },
            });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: 10 }));

            service['evaluateFlagCarrier'](session, VP_PLAYER_ID, flagCarrier, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add flag carrier target when conditions are met', () => {
            const session = createMockSession();
            const flagCarrier = createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_2 });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.BASE, open: false, x: POSITION_X_2, y: POSITION_Y_2, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: 3 }));

            service['evaluateFlagCarrier'](session, VP_PLAYER_ID, flagCarrier, results, config);

            expect(results.length).toBe(ONE);
            expect(results[ZERO].type).toBe('flagCarrier');
        });
    });

    describe('evaluateGuardPoint', () => {
        it('should return early when start point is missing', () => {
            const session = createMockSession({
                startPoints: [],
            });
            const flagCarrier = createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_2 });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            service['evaluateGuardPoint'](session, VP_PLAYER_ID, flagCarrier, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should return early when path is not reachable', () => {
            const session = createMockSession({
                startPoints: [createMockStartPoint({ playerId: FLAG_CARRIER_ID })],
            });
            const flagCarrier = createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_2 });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));

            service['evaluateGuardPoint'](session, VP_PLAYER_ID, flagCarrier, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should return early when distance exceeds maxGuardStartPointDistance', () => {
            const session = createMockSession({
                startPoints: [createMockStartPoint({ playerId: FLAG_CARRIER_ID })],
            });
            const flagCarrier = createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_2 });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig({
                flag: {
                    chaseFlagCarrierPriority: ZERO,
                    guardStartPointPriority: 80,
                    chaseFlagCarrierPenaltyPerTile: TWO,
                    guardStartPointPenaltyPerTile: ONE,
                    chaseFlagCarrierBonus: 10,
                    guardStartPointBonus: 5,
                    maxChaseFlagCarrierDistance: 12,
                    maxGuardStartPointDistance: 5,
                },
            });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: 10 }));

            service['evaluateGuardPoint'](session, VP_PLAYER_ID, flagCarrier, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add guard point target when conditions are met', () => {
            const session = createMockSession({
                startPoints: [createMockStartPoint({ playerId: FLAG_CARRIER_ID })],
            });
            const flagCarrier = createMockPlayer({ id: FLAG_CARRIER_ID, teamNumber: TEAM_2 });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.BASE, open: false, x: START_POINT_X, y: START_POINT_Y, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: 3 }));

            service['evaluateGuardPoint'](session, VP_PLAYER_ID, flagCarrier, results, config);

            expect(results.length).toBe(ONE);
            expect(results[ZERO].type).toBe('guardPoint');
        });
    });

    describe('findBestPathToAdjacent', () => {
        it('should return unreachable result when player is missing', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });
            const targetPosition = createMockPosition();

            const result = service['findBestPathToAdjacent'](session, VP_PLAYER_ID, targetPosition);

            expect(result.reachable).toBe(false);
        });

        it('should return zero cost path when already adjacent', () => {
            const session = createMockSession();
            const targetPosition = createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 });

            const result = service['findBestPathToAdjacent'](session, VP_PLAYER_ID, targetPosition);

            expect(result.reachable).toBe(true);
            expect(result.totalCost).toBe(ZERO);
        });

        it('should find best path to adjacent position', () => {
            const session = createMockSession();
            const targetPosition = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.BASE, open: false, x: POSITION_X_1 + ONE, y: POSITION_Y_1, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: 2 }));

            const result = service['findBestPathToAdjacent'](session, VP_PLAYER_ID, targetPosition);

            expect(result.reachable).toBe(true);
        });

        it('should return unreachable result when no valid adjacent position found', () => {
            const session = createMockSession();
            const targetPosition = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.WALL, open: false, x: POSITION_X_1 + ONE, y: POSITION_Y_1, playerId: null });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));

            const result = service['findBestPathToAdjacent'](session, VP_PLAYER_ID, targetPosition);

            expect(result.reachable).toBe(false);
        });
    });

    describe('getAdjacentPositions', () => {
        it('should return four adjacent positions', () => {
            const position = createMockPosition();

            const result = service['getAdjacentPositions'](position);

            expect(result.length).toBe(FOUR);
            expect(result).toContainEqual({ x: position.x, y: position.y - ONE });
            expect(result).toContainEqual({ x: position.x + ONE, y: position.y });
            expect(result).toContainEqual({ x: position.x, y: position.y + ONE });
            expect(result).toContainEqual({ x: position.x - ONE, y: position.y });
        });
    });

    describe('isAdjacent', () => {
        it('should return true when positions are horizontally adjacent', () => {
            const pos1 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const pos2 = createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 });

            const result = service['isAdjacent'](pos1, pos2);

            expect(result).toBe(true);
        });

        it('should return true when positions are vertically adjacent', () => {
            const pos1 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const pos2 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 + ONE });

            const result = service['isAdjacent'](pos1, pos2);

            expect(result).toBe(true);
        });

        it('should return false when positions are not adjacent', () => {
            const pos1 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const pos2 = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });

            const result = service['isAdjacent'](pos1, pos2);

            expect(result).toBe(false);
        });

        it('should return false when positions are the same', () => {
            const pos1 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const pos2 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });

            const result = service['isAdjacent'](pos1, pos2);

            expect(result).toBe(false);
        });
    });

    describe('isValidAdjacentPosition', () => {
        it('should return false when position is out of bounds', () => {
            const session = createMockSession();
            const position = createMockPosition({ x: -ONE, y: POSITION_Y_1 });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            const result = service['isValidAdjacentPosition'](session, position, VP_PLAYER_ID);

            expect(result).toBe(false);
        });

        it('should return false when tile is WALL', () => {
            const session = createMockSession();
            const position = createMockPosition();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.WALL, open: false, x: position.x, y: position.y, playerId: null });

            const result = service['isValidAdjacentPosition'](session, position, VP_PLAYER_ID);

            expect(result).toBe(false);
        });

        it('should return false when tile is WATER', () => {
            const session = createMockSession();
            const position = createMockPosition();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.WATER, open: false, x: position.x, y: position.y, playerId: null });

            const result = service['isValidAdjacentPosition'](session, position, VP_PLAYER_ID);

            expect(result).toBe(false);
        });

        it('should return false when tile is occupied by another player', () => {
            const session = createMockSession();
            const position = createMockPosition();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.BASE, open: false, x: position.x, y: position.y, playerId: null });
            gameCache.getTileOccupant.mockReturnValue('other-player-id');

            const result = service['isValidAdjacentPosition'](session, position, VP_PLAYER_ID);

            expect(result).toBe(false);
        });

        it('should return true when position is valid', () => {
            const session = createMockSession();
            const position = createMockPosition();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.BASE, open: false, x: position.x, y: position.y, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service['isValidAdjacentPosition'](session, position, VP_PLAYER_ID);

            expect(result).toBe(true);
        });

        it('should return true when tile is occupied by VP player', () => {
            const session = createMockSession();
            const position = createMockPosition();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: TileKind.BASE, open: false, x: position.x, y: position.y, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(VP_PLAYER_ID);

            const result = service['isValidAdjacentPosition'](session, position, VP_PLAYER_ID);

            expect(result).toBe(true);
        });
    });

    describe('createUnreachableResult', () => {
        it('should create unreachable path result', () => {
            const targetPosition = createMockPosition();

            const result = service['createUnreachableResult'](targetPosition);

            expect(result.reachable).toBe(false);
            expect(result.totalCost).toBe(Infinity);
            expect(result.destination).toEqual(targetPosition);
        });
    });

    describe('findEnemyBlockingDirectPath', () => {
        it('should return null when VP player is missing', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });
            const targetPosition = createMockPosition();

            const result = service['findEnemyBlockingDirectPath'](session, VP_PLAYER_ID, targetPosition);

            expect(result).toBeNull();
        });

        it('should return null when no blocking enemy is found', () => {
            const session = createMockSession();
            const targetPosition = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service['findEnemyBlockingDirectPath'](session, VP_PLAYER_ID, targetPosition);

            expect(result).toBeNull();
        });

        it('should return blocking enemy when found in direct path', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: TEAM_2 }),
                },
            });
            const targetPosition = createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            const result = service['findEnemyBlockingDirectPath'](session, VP_PLAYER_ID, targetPosition);

            expect(result).not.toBeNull();
            expect(result?.id).toBe(ENEMY_PLAYER_ID);
        });

        it('should skip when occupant is VP player', () => {
            const session = createMockSession();
            const targetPosition = createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 });
            gameCache.getTileOccupant.mockReturnValue(VP_PLAYER_ID);

            const result = service['findEnemyBlockingDirectPath'](session, VP_PLAYER_ID, targetPosition);

            expect(result).toBeNull();
        });

        it('should skip when occupant has no health', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: TEAM_2, health: ZERO }),
                },
            });
            const targetPosition = createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            const result = service['findEnemyBlockingDirectPath'](session, VP_PLAYER_ID, targetPosition);

            expect(result).toBeNull();
        });

        it('should skip when occupant is on same team', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, teamNumber: TEAM_1 }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: TEAM_1 }),
                },
            });
            const targetPosition = createMockPosition({ x: POSITION_X_1 + ONE, y: POSITION_Y_1 });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            const result = service['findEnemyBlockingDirectPath'](session, VP_PLAYER_ID, targetPosition);

            expect(result).toBeNull();
        });
    });

    describe('getDirectDirectionsToTarget', () => {
        it('should return east direction when target is to the east', () => {
            const from = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const to = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_1 });

            const result = service['getDirectDirectionsToTarget'](from, to);

            expect(result).toContain(Orientation.E);
        });

        it('should return west direction when target is to the west', () => {
            const from = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_1 });
            const to = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });

            const result = service['getDirectDirectionsToTarget'](from, to);

            expect(result).toContain(Orientation.W);
        });

        it('should return south direction when target is to the south', () => {
            const from = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const to = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_2 });

            const result = service['getDirectDirectionsToTarget'](from, to);

            expect(result).toContain(Orientation.S);
        });

        it('should return north direction when target is to the north', () => {
            const from = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_2 });
            const to = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });

            const result = service['getDirectDirectionsToTarget'](from, to);

            expect(result).toContain(Orientation.N);
        });

        it('should return multiple directions when target is diagonal', () => {
            const from = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const to = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });

            const result = service['getDirectDirectionsToTarget'](from, to);

            expect(result.length).toBeGreaterThan(ONE);
            expect(result).toContain(Orientation.E);
            expect(result).toContain(Orientation.S);
        });
    });

    describe('getNextPositionFromOrientation', () => {
        it('should return north position for north orientation', () => {
            const currentPos = createMockPosition();
            const expectedPos = { x: currentPos.x, y: currentPos.y - ONE };

            const result = service['getNextPositionFromOrientation'](currentPos, Orientation.N);

            expect(result).toEqual(expectedPos);
        });

        it('should return east position for east orientation', () => {
            const currentPos = createMockPosition();
            const expectedPos = { x: currentPos.x + ONE, y: currentPos.y };

            const result = service['getNextPositionFromOrientation'](currentPos, Orientation.E);

            expect(result).toEqual(expectedPos);
        });

        it('should return south position for south orientation', () => {
            const currentPos = createMockPosition();
            const expectedPos = { x: currentPos.x, y: currentPos.y + ONE };

            const result = service['getNextPositionFromOrientation'](currentPos, Orientation.S);

            expect(result).toEqual(expectedPos);
        });

        it('should return west position for west orientation', () => {
            const currentPos = createMockPosition();
            const expectedPos = { x: currentPos.x - ONE, y: currentPos.y };

            const result = service['getNextPositionFromOrientation'](currentPos, Orientation.W);

            expect(result).toEqual(expectedPos);
        });

        it('should return current position for unknown orientation', () => {
            const currentPos = createMockPosition();

            const result = service['getNextPositionFromOrientation'](currentPos, 'unknown' as Orientation);

            expect(result).toEqual(currentPos);
        });
    });

    describe('evaluateBlockingEnemyAttack', () => {
        it('should return early when VP player is missing', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });
            const blockingEnemy = { id: ENEMY_PLAYER_ID, position: createMockPosition() };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            service['evaluateBlockingEnemyAttack'](session, VP_PLAYER_ID, blockingEnemy, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add blocking enemy attack to results', () => {
            const session = createMockSession();
            const blockingEnemy = { id: ENEMY_PLAYER_ID, position: createMockPosition() };
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig({
                bonuses: {
                    adjacentAttackBonus: ADJACENT_ATTACK_BONUS,
                    lowHealthHealBonus: ZERO,
                    criticalHealthHealBonus: ZERO,
                    noBonusFightSanctuaryBonus: ZERO,
                    escapeWhenEnemyCloseBonus: ZERO,
                },
            });

            service['evaluateBlockingEnemyAttack'](session, VP_PLAYER_ID, blockingEnemy, results, config);

            expect(results.length).toBe(ONE);
            expect(results[ZERO].type).toBe(PointOfInterestType.ENEMY);
            expect(results[ZERO].playerId).toBe(ENEMY_PLAYER_ID);
            expect(results[ZERO].priorityScore).toBe(BLOCKED_FLAG_CARRIER_ATTACK_PRIORITY + ADJACENT_ATTACK_BONUS);
        });
    });

    describe('evaluateAdjacentEnemiesForBlockedFlagCarrier', () => {
        it('should return early when VP player is missing', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();

            service['evaluateAdjacentEnemiesForBlockedFlagCarrier'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip when no occupant found', () => {
            const session = createMockSession();
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            gameCache.getTileOccupant.mockReturnValue(null);

            service['evaluateAdjacentEnemiesForBlockedFlagCarrier'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip when occupant is VP player', () => {
            const session = createMockSession();
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            gameCache.getTileOccupant.mockReturnValue(VP_PLAYER_ID);

            service['evaluateAdjacentEnemiesForBlockedFlagCarrier'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip when occupant has no health', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: TEAM_2, health: ZERO }),
                },
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            service['evaluateAdjacentEnemiesForBlockedFlagCarrier'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip when occupant is on same team', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, teamNumber: TEAM_1 }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: TEAM_1 }),
                },
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig();
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            service['evaluateAdjacentEnemiesForBlockedFlagCarrier'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add adjacent enemy to results when found', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, teamNumber: TEAM_1 }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: TEAM_2 }),
                },
            });
            const results: EvaluatedTarget[] = [];
            const config = createMockVPConfig({
                bonuses: {
                    adjacentAttackBonus: ADJACENT_ATTACK_BONUS,
                    lowHealthHealBonus: ZERO,
                    criticalHealthHealBonus: ZERO,
                    noBonusFightSanctuaryBonus: ZERO,
                    escapeWhenEnemyCloseBonus: ZERO,
                },
            });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            service['evaluateAdjacentEnemiesForBlockedFlagCarrier'](session, VP_PLAYER_ID, results, config);

            expect(results.length).toBeGreaterThan(ZERO);
            expect(results.some((r) => r.type === PointOfInterestType.ENEMY && r.playerId === ENEMY_PLAYER_ID)).toBe(true);
        });
    });
});

