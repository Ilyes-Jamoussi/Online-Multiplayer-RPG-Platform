import { DEFENSIVE_VP_CONFIG, OFFENSIVE_VP_CONFIG } from '@app/constants/vp.config';
import { EvaluatedTarget, PointOfInterestWithPath } from '@app/interfaces/vp-gameplay.interface';
import { EscapePoint, PathResult } from '@app/interfaces/vp-pathfinding.interface';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { VPCTFService } from '@app/modules/in-game/services/vp-ctf/vp-ctf.service';
import { VPPathfindingService } from '@app/modules/in-game/services/vp-pathfinding/vp-pathfinding.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { VPGameplayService } from './vp-gameplay.service';

describe('VPGameplayService', () => {
    let service: VPGameplayService;
    let gameCache: jest.Mocked<GameCacheService>;
    let pathfindingService: jest.Mocked<VPPathfindingService>;
    let ctfService: jest.Mocked<VPCTFService>;

    const SESSION_ID = 'session-123';
    const VP_PLAYER_ID = 'vp-player-1';
    const ENEMY_PLAYER_ID = 'enemy-player-1';
    const TEAM_1 = 1;
    const TEAM_2 = 2;
    const POSITION_X_1 = 5;
    const POSITION_Y_1 = 10;
    const POSITION_X_2 = 7;
    const POSITION_Y_2 = 12;
    const MAP_SIZE = 15;
    const HEALTH = 100;
    const MAX_HEALTH = 100;
    const HEALTH_LOW = 30;
    const HEALTH_CRITICAL = 15;
    const ATTACK_BONUS = 5;
    const DEFENSE_BONUS = 3;
    const ACTIONS_REMAINING = 1;
    const PATH_COST = 5;
    const DISTANCE_TO_ENEMY = 2;
    const ESCAPE_DISTANCE = 10;
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
        baseHealth: HEALTH,
        healthBonus: ZERO,
        health: HEALTH,
        maxHealth: MAX_HEALTH,
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
        actionsRemaining: ACTIONS_REMAINING,
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
            [TEAM_1]: { number: TEAM_1, playerIds: [VP_PLAYER_ID] },
            [TEAM_2]: { number: TEAM_2, playerIds: [ENEMY_PLAYER_ID] },
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
            getGameMapForSession: jest.fn(),
            getMapSize: jest.fn(),
            getTileAtPosition: jest.fn(),
            getTileOccupant: jest.fn(),
        };

        const mockPathfindingService = {
            findPath: jest.fn(),
            findBestEscapePoint: jest.fn(),
        };

        const mockCTFService = {
            evaluateCTFObjectives: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VPGameplayService,
                {
                    provide: GameCacheService,
                    useValue: mockGameCache,
                },
                {
                    provide: VPPathfindingService,
                    useValue: mockPathfindingService,
                },
                {
                    provide: VPCTFService,
                    useValue: mockCTFService,
                },
            ],
        }).compile();

        service = module.get<VPGameplayService>(VPGameplayService);
        gameCache = module.get(GameCacheService);
        pathfindingService = module.get(VPPathfindingService);
        ctfService = module.get(VPCTFService);
    });

    describe('getConfigForType', () => {
        it('should return offensive config for Offensive type', () => {
            const result = service.getConfigForType(VirtualPlayerType.Offensive);

            expect(result).toBe(OFFENSIVE_VP_CONFIG);
        });

        it('should return defensive config for Defensive type', () => {
            const result = service.getConfigForType(VirtualPlayerType.Defensive);

            expect(result).toBe(DEFENSIVE_VP_CONFIG);
        });
    });

    describe('makeDecision', () => {
        it('should return empty decision when player is missing', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            expect(result.target).toBeNull();
            expect(result.allEvaluatedTargets).toEqual([]);
            expect(result.useDoubleAction).toBe(false);
        });

        it('should evaluate enemies', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, x: POSITION_X_2, y: POSITION_Y_2 }),
                },
            });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: POSITION_X_2, y: POSITION_Y_2, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: DISTANCE_TO_ENEMY }));
            ctfService.evaluateCTFObjectives.mockReturnValue(false);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            expect(result.allEvaluatedTargets.length).toBeGreaterThan(ZERO);
        });

        it('should evaluate heal sanctuaries when health is low', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, health: HEALTH_LOW, maxHealth: MAX_HEALTH }),
                },
            });
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: POSITION_X_1, y: POSITION_Y_1, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: THREE }));
            ctfService.evaluateCTFObjectives.mockReturnValue(false);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            expect(result.allEvaluatedTargets.some((t) => t.type === 'healSanctuary')).toBe(true);
        });

        it('should not evaluate heal sanctuaries when health is above threshold', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, health: HEALTH, maxHealth: MAX_HEALTH }),
                },
            });
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true }));
            ctfService.evaluateCTFObjectives.mockReturnValue(false);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            expect(result.allEvaluatedTargets.some((t) => t.type === 'healSanctuary')).toBe(false);
        });

        it('should evaluate fight sanctuaries when player has no bonuses', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, attackBonus: ZERO, defenseBonus: ZERO }),
                },
            });
            const placeable = createMockPlaceable({ kind: PlaceableKind.FIGHT });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: POSITION_X_1, y: POSITION_Y_1, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: THREE }));
            ctfService.evaluateCTFObjectives.mockReturnValue(false);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            expect(result.allEvaluatedTargets.some((t) => t.type === 'fightSanctuary')).toBe(true);
        });

        it('should not evaluate fight sanctuaries when player has bonuses', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, attackBonus: ATTACK_BONUS }),
                },
            });
            const placeable = createMockPlaceable({ kind: PlaceableKind.FIGHT });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true }));
            ctfService.evaluateCTFObjectives.mockReturnValue(false);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            expect(result.allEvaluatedTargets.some((t) => t.type === 'fightSanctuary')).toBe(false);
        });

        it('should evaluate CTF objectives when mode is CTF', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
            });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));
            ctfService.evaluateCTFObjectives.mockReturnValue(true);

            service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            expect(ctfService.evaluateCTFObjectives).toHaveBeenCalled();
        });

        it('should not evaluate escape when CTF objective is active', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
            });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));
            ctfService.evaluateCTFObjectives.mockReturnValue(true);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Defensive);

            expect(result.allEvaluatedTargets.some((t) => t.type === 'escape')).toBe(false);
        });

        it('should evaluate escape when escape priority is greater than zero and CTF is not active', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, x: POSITION_X_2, y: POSITION_Y_2 }),
                },
            });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: POSITION_X_2, y: POSITION_Y_2, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: DISTANCE_TO_ENEMY }));
            pathfindingService.findBestEscapePoint.mockReturnValue({
                position: createMockPosition(),
                path: createMockPathResult({ reachable: true }),
                distanceFromEnemies: ESCAPE_DISTANCE,
            });
            ctfService.evaluateCTFObjectives.mockReturnValue(false);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Defensive);

            expect(result.allEvaluatedTargets.some((t) => t.type === 'escape')).toBe(true);
        });

        it('should sort evaluated targets by priority score', () => {
            const session = createMockSession();
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true }));
            ctfService.evaluateCTFObjectives.mockReturnValue(false);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            for (let i = ZERO; i < result.allEvaluatedTargets.length - ONE; i++) {
                expect(result.allEvaluatedTargets[i].priorityScore).toBeGreaterThanOrEqual(result.allEvaluatedTargets[i + ONE].priorityScore);
            }
        });

        it('should return null target when no targets have positive score', () => {
            const session = createMockSession();
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));
            ctfService.evaluateCTFObjectives.mockReturnValue(false);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            expect(result.target).toBeNull();
        });

        it('should set useDoubleAction when best target is fightSanctuary and random is below rate', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, attackBonus: ZERO, defenseBonus: ZERO }),
                },
            });
            const placeable = createMockPlaceable({ kind: PlaceableKind.FIGHT });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: THREE }));
            ctfService.evaluateCTFObjectives.mockReturnValue(false);
            jest.spyOn(Math, 'random').mockReturnValue(0.3);

            const result = service.makeDecision(session, VP_PLAYER_ID, VirtualPlayerType.Offensive);

            if (result.target?.type === 'fightSanctuary') {
                expect(result.useDoubleAction).toBe(true);
            }

            jest.spyOn(Math, 'random').mockRestore();
        });
    });

    describe('evaluateEnemies', () => {
        it('should skip unreachable enemies', () => {
            const enemies: PointOfInterestWithPath[] = [
                {
                    type: 'enemy',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: false }),
                    playerId: ENEMY_PLAYER_ID,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateEnemies'](enemies, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add adjacent attack bonus when distance is zero', () => {
            const enemies: PointOfInterestWithPath[] = [
                {
                    type: 'enemy',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: ZERO }),
                    playerId: ENEMY_PLAYER_ID,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateEnemies'](enemies, results, config);

            expect(results[ZERO].priorityScore).toBeGreaterThan(config.priorities.attack);
        });

        it('should calculate score correctly for reachable enemies', () => {
            const enemies: PointOfInterestWithPath[] = [
                {
                    type: 'enemy',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: DISTANCE_TO_ENEMY }),
                    playerId: ENEMY_PLAYER_ID,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateEnemies'](enemies, results, config);

            expect(results.length).toBe(ONE);
            expect(results[ZERO].priorityScore).toBeGreaterThanOrEqual(ZERO);
        });
    });

    describe('evaluateHealSanctuaries', () => {
        it('should return early when health is above threshold', () => {
            const player = createMockPlayer({ health: HEALTH, maxHealth: MAX_HEALTH });
            const sanctuaries: PointOfInterestWithPath[] = [
                {
                    type: 'healSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true }),
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateHealSanctuaries'](sanctuaries, player, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip unreachable sanctuaries', () => {
            const player = createMockPlayer({ health: HEALTH_LOW, maxHealth: MAX_HEALTH });
            const sanctuaries: PointOfInterestWithPath[] = [
                {
                    type: 'healSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: false }),
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateHealSanctuaries'](sanctuaries, player, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip sanctuaries beyond max distance', () => {
            const player = createMockPlayer({ health: HEALTH_LOW, maxHealth: MAX_HEALTH });
            const sanctuaries: PointOfInterestWithPath[] = [
                {
                    type: 'healSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: 20 }),
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateHealSanctuaries'](sanctuaries, player, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add critical health bonus when health is critical', () => {
            const player = createMockPlayer({ health: HEALTH_CRITICAL, maxHealth: MAX_HEALTH });
            const sanctuaries: PointOfInterestWithPath[] = [
                {
                    type: 'healSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: THREE }),
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateHealSanctuaries'](sanctuaries, player, results, config);

            expect(results.length).toBe(ONE);
            expect(results[ZERO].priorityScore).toBeGreaterThan(ZERO);
        });
    });

    describe('evaluateFightSanctuaries', () => {
        it('should return early when player has attack bonus', () => {
            const player = createMockPlayer({ attackBonus: ATTACK_BONUS });
            const sanctuaries: PointOfInterestWithPath[] = [
                {
                    type: 'fightSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true }),
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateFightSanctuaries'](sanctuaries, player, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should return early when player has defense bonus', () => {
            const player = createMockPlayer({ defenseBonus: DEFENSE_BONUS });
            const sanctuaries: PointOfInterestWithPath[] = [
                {
                    type: 'fightSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true }),
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateFightSanctuaries'](sanctuaries, player, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip unreachable sanctuaries', () => {
            const player = createMockPlayer({ attackBonus: ZERO, defenseBonus: ZERO });
            const sanctuaries: PointOfInterestWithPath[] = [
                {
                    type: 'fightSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: false }),
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateFightSanctuaries'](sanctuaries, player, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should skip sanctuaries beyond max distance', () => {
            const player = createMockPlayer({ attackBonus: ZERO, defenseBonus: ZERO });
            const sanctuaries: PointOfInterestWithPath[] = [
                {
                    type: 'fightSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: 20 }),
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateFightSanctuaries'](sanctuaries, player, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add fight sanctuary when conditions are met', () => {
            const player = createMockPlayer({ attackBonus: ZERO, defenseBonus: ZERO });
            const sanctuaries: PointOfInterestWithPath[] = [
                {
                    type: 'fightSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: THREE }),
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = OFFENSIVE_VP_CONFIG;

            service['evaluateFightSanctuaries'](sanctuaries, player, results, config);

            expect(results.length).toBe(ONE);
        });
    });

    describe('evaluateEscape', () => {
        it('should return early when no enemies', () => {
            const session = createMockSession();
            const enemies: PointOfInterestWithPath[] = [];
            const results: EvaluatedTarget[] = [];
            const config = DEFENSIVE_VP_CONFIG;

            service['evaluateEscape'](session, VP_PLAYER_ID, enemies, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should return early when nearest enemy is too far', () => {
            const session = createMockSession();
            const enemies: PointOfInterestWithPath[] = [
                {
                    type: 'enemy',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: 10 }),
                    playerId: ENEMY_PLAYER_ID,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = DEFENSIVE_VP_CONFIG;

            service['evaluateEscape'](session, VP_PLAYER_ID, enemies, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should return early when no escape point found', () => {
            const session = createMockSession();
            const enemies: PointOfInterestWithPath[] = [
                {
                    type: 'enemy',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: DISTANCE_TO_ENEMY }),
                    playerId: ENEMY_PLAYER_ID,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = DEFENSIVE_VP_CONFIG;
            pathfindingService.findBestEscapePoint.mockReturnValue(null);

            service['evaluateEscape'](session, VP_PLAYER_ID, enemies, results, config);

            expect(results.length).toBe(ZERO);
        });

        it('should add escape target when conditions are met', () => {
            const session = createMockSession();
            const enemies: PointOfInterestWithPath[] = [
                {
                    type: 'enemy',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: DISTANCE_TO_ENEMY }),
                    playerId: ENEMY_PLAYER_ID,
                },
            ];
            const results: EvaluatedTarget[] = [];
            const config = DEFENSIVE_VP_CONFIG;
            const escapePoint: EscapePoint = {
                position: createMockPosition(),
                path: createMockPathResult({ reachable: true }),
                distanceFromEnemies: ESCAPE_DISTANCE,
            };
            pathfindingService.findBestEscapePoint.mockReturnValue(escapePoint);

            service['evaluateEscape'](session, VP_PLAYER_ID, enemies, results, config);

            expect(results.length).toBe(ONE);
            expect(results[ZERO].type).toBe('escape');
        });
    });

    describe('scanMapForPointsOfInterest', () => {
        it('should scan for enemies', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, x: POSITION_X_2, y: POSITION_Y_2 }),
                },
            });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.enemies.length).toBe(ONE);
        });

        it('should skip VP player from enemies', () => {
            const session = createMockSession();
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.enemies.every((e) => e.playerId !== VP_PLAYER_ID)).toBe(true);
        });

        it('should skip players with zero health', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, health: ZERO }),
                },
            });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.enemies.length).toBe(ZERO);
        });

        it('should skip teammates in CTF mode', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID, teamNumber: TEAM_1 }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: TEAM_1 }),
                },
            });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.enemies.length).toBe(ZERO);
        });

        it('should scan for heal sanctuaries', () => {
            const session = createMockSession();
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.healSanctuaries.length).toBe(ONE);
        });

        it('should scan for fight sanctuaries', () => {
            const session = createMockSession();
            const placeable = createMockPlaceable({ kind: PlaceableKind.FIGHT });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.fightSanctuaries.length).toBe(ONE);
        });

        it('should scan for boats', () => {
            const session = createMockSession();
            const placeable = createMockPlaceable({ kind: PlaceableKind.BOAT });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.boats.length).toBe(ONE);
        });

        it('should scan for flags', () => {
            const session = createMockSession();
            const placeable = createMockPlaceable({ kind: PlaceableKind.FLAG });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.flags.length).toBe(ONE);
        });

        it('should set isHeld to true when flag has holder', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: ENEMY_PLAYER_ID },
            });
            const placeable = createMockPlaceable({ kind: PlaceableKind.FLAG });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.flags[ZERO].isHeld).toBe(true);
        });

        it('should set isHeld to false when flag has no holder', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: null },
            });
            const placeable = createMockPlaceable({ kind: PlaceableKind.FLAG });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.flags[ZERO].isHeld).toBe(false);
        });

        it('should skip unplaced placeables', () => {
            const session = createMockSession();
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL, placed: false });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [placeable], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.healSanctuaries.length).toBe(ZERO);
        });

        it('should return early when game map is not found', () => {
            const session = createMockSession();
            gameCache.getGameMapForSession.mockReturnValue(null);

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.healSanctuaries.length).toBe(ZERO);
        });

        it('should populate all array with all points', () => {
            const session = createMockSession();
            const healPlaceable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            const fightPlaceable = createMockPlaceable({ kind: PlaceableKind.FIGHT, x: POSITION_X_2, y: POSITION_Y_2 });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [healPlaceable, fightPlaceable], size: MapSize.MEDIUM });

            const result = service.scanMapForPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.all.length).toBe(result.healSanctuaries.length + result.fightSanctuaries.length + result.boats.length + result.flags.length);
        });
    });

    describe('scanForEnemies', () => {
        it('should return early when VP player is missing', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });
            const result = {
                enemies: [],
                healSanctuaries: [],
                fightSanctuaries: [],
                boats: [],
                flags: [],
                all: [],
            };

            service['scanForEnemies'](session, VP_PLAYER_ID, result);

            expect(result.enemies.length).toBe(ZERO);
        });
    });

    describe('calculateDistancesToPointsOfInterest', () => {
        it('should add paths to enemies', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [VP_PLAYER_ID]: createMockPlayer({ id: VP_PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID }),
                },
            });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [], size: MapSize.MEDIUM });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: POSITION_X_2, y: POSITION_Y_2, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true }));

            const result = service.calculateDistancesToPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.enemies.length).toBeGreaterThanOrEqual(ZERO);
        });

        it('should add paths to all point types', () => {
            const session = createMockSession();
            const healPlaceable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            const fightPlaceable = createMockPlaceable({ kind: PlaceableKind.FIGHT });
            const boatPlaceable = createMockPlaceable({ kind: PlaceableKind.BOAT });
            const flagPlaceable = createMockPlaceable({ kind: PlaceableKind.FLAG });
            gameCache.getGameMapForSession.mockReturnValue({ tiles: [], objects: [healPlaceable, fightPlaceable, boatPlaceable, flagPlaceable], size: MapSize.MEDIUM });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: POSITION_X_1, y: POSITION_Y_1, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true }));

            const result = service.calculateDistancesToPointsOfInterest(session, VP_PLAYER_ID);

            expect(result.healSanctuaries.length).toBe(ONE);
            expect(result.fightSanctuaries.length).toBe(ONE);
            expect(result.boats.length).toBe(ONE);
            expect(result.flags.length).toBe(ONE);
        });
    });

    describe('addPathsToPoints', () => {
        it('should add paths to points', () => {
            const session = createMockSession();
            const points = [
                {
                    type: 'healSanctuary' as const,
                    position: createMockPosition(),
                },
            ];
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true }));

            const result = service['addPathsToPoints'](session, VP_PLAYER_ID, points);

            expect(result.length).toBe(ONE);
            expect(result[ZERO].path).toBeDefined();
        });
    });

    describe('addPathsToAdjacentTiles', () => {
        it('should add paths to adjacent tiles', () => {
            const session = createMockSession();
            const points = [
                {
                    type: 'enemy' as const,
                    position: createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 }),
                    playerId: ENEMY_PLAYER_ID,
                },
            ];
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: POSITION_X_1 + ONE, y: POSITION_Y_1, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true }));

            const result = service['addPathsToAdjacentTiles'](session, VP_PLAYER_ID, points);

            expect(result.length).toBe(ONE);
            expect(result[ZERO].path).toBeDefined();
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
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: POSITION_X_1 + ONE, y: POSITION_Y_1, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: true, totalCost: TWO }));

            const result = service['findBestPathToAdjacent'](session, VP_PLAYER_ID, targetPosition);

            expect(result.reachable).toBe(true);
        });

        it('should return unreachable result when no valid adjacent position found', () => {
            const session = createMockSession();
            const targetPosition = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(null);
            pathfindingService.findPath.mockReturnValue(createMockPathResult({ reachable: false }));

            const result = service['findBestPathToAdjacent'](session, VP_PLAYER_ID, targetPosition);

            expect(result.reachable).toBe(false);
        });
    });

    describe('isPathBetter', () => {
        it('should return true when new path allows action and current does not', () => {
            const newPath = createMockPathResult({ actionsRequired: ZERO });
            const currentBest = createMockPathResult({ actionsRequired: TWO });
            const actionsRemaining = ONE;

            const result = service['isPathBetter'](newPath, currentBest, actionsRemaining);

            expect(result).toBe(true);
        });

        it('should return false when current path allows action and new does not', () => {
            const newPath = createMockPathResult({ actionsRequired: TWO });
            const currentBest = createMockPathResult({ actionsRequired: ZERO });
            const actionsRemaining = ONE;

            const result = service['isPathBetter'](newPath, currentBest, actionsRemaining);

            expect(result).toBe(false);
        });

        it('should compare by totalCost when both allow action', () => {
            const newPath = createMockPathResult({ actionsRequired: ZERO, totalCost: ONE });
            const currentBest = createMockPathResult({ actionsRequired: ZERO, totalCost: TWO });
            const actionsRemaining = ONE;

            const result = service['isPathBetter'](newPath, currentBest, actionsRemaining);

            expect(result).toBe(true);
        });

        it('should compare by totalCost when neither allows action', () => {
            const newPath = createMockPathResult({ actionsRequired: TWO, totalCost: ONE });
            const currentBest = createMockPathResult({ actionsRequired: TWO, totalCost: TWO });
            const actionsRemaining = ONE;

            const result = service['isPathBetter'](newPath, currentBest, actionsRemaining);

            expect(result).toBe(true);
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

        it('should return false when tile is not found', () => {
            const session = createMockSession();
            const position = createMockPosition();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(null);

            const result = service['isValidAdjacentPosition'](session, position, VP_PLAYER_ID);

            expect(result).toBe(false);
        });

        it('should return false when tile is occupied by another player', () => {
            const session = createMockSession();
            const position = createMockPosition();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: position.x, y: position.y, playerId: null });
            gameCache.getTileOccupant.mockReturnValue('other-player-id');

            const result = service['isValidAdjacentPosition'](session, position, VP_PLAYER_ID);

            expect(result).toBe(false);
        });

        it('should return true when position is valid', () => {
            const session = createMockSession();
            const position = createMockPosition();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: position.x, y: position.y, playerId: null });
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service['isValidAdjacentPosition'](session, position, VP_PLAYER_ID);

            expect(result).toBe(true);
        });

        it('should return true when tile is occupied by VP player', () => {
            const session = createMockSession();
            const position = createMockPosition();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue({ kind: null, open: false, x: position.x, y: position.y, playerId: null });
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

    describe('findNearestPoint', () => {
        it('should return null when no reachable points', () => {
            const points: PointOfInterestWithPath[] = [
                {
                    type: 'healSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: false }),
                },
            ];

            const result = service.findNearestPoint(points);

            expect(result).toBeNull();
        });

        it('should return nearest reachable point', () => {
            const points: PointOfInterestWithPath[] = [
                {
                    type: 'healSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: true, totalCost: THREE }),
                },
                {
                    type: 'healSanctuary',
                    position: createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 }),
                    path: createMockPathResult({ reachable: true, totalCost: ONE }),
                },
            ];

            const result = service.findNearestPoint(points);

            expect(result).not.toBeNull();
            expect(result?.path.totalCost).toBe(ONE);
        });
    });

    describe('getReachablePointsSortedByDistance', () => {
        it('should return only reachable points sorted by distance', () => {
            const points: PointOfInterestWithPath[] = [
                {
                    type: 'healSanctuary',
                    position: createMockPosition(),
                    path: createMockPathResult({ reachable: false }),
                },
                {
                    type: 'healSanctuary',
                    position: createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 }),
                    path: createMockPathResult({ reachable: true, totalCost: THREE }),
                },
                {
                    type: 'healSanctuary',
                    position: createMockPosition({ x: POSITION_X_1, y: POSITION_Y_2 }),
                    path: createMockPathResult({ reachable: true, totalCost: ONE }),
                },
            ];

            const result = service.getReachablePointsSortedByDistance(points);

            expect(result.length).toBe(TWO);
            expect(result[ZERO].path.totalCost).toBe(ONE);
            expect(result[ONE].path.totalCost).toBe(THREE);
        });
    });
});

