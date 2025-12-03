/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { VIRTUAL_PLAYER_ACTION_DELAY_MS, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS } from '@app/constants/virtual-player.constants';
import { PathActionType } from '@app/enums/path-action-type.enum';
import { PointOfInterestType } from '@app/enums/point-of-interest-type.enum';
import { EvaluatedTarget } from '@app/interfaces/vp-gameplay.interface';
import { PathAction, PathResult } from '@app/interfaces/vp-pathfinding.interface';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { VPGameplayService } from '@app/modules/in-game/services/vp-gameplay/vp-gameplay.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { VPExecutionService } from './vp-execution.service';

describe('VPExecutionService', () => {
    let service: VPExecutionService;
    let gameplayService: jest.Mocked<GameplayService>;
    let vpGameplayService: jest.Mocked<VPGameplayService>;
    let sessionRepository: jest.Mocked<InGameSessionRepository>;
    let actionService: jest.Mocked<ActionService>;
    let gameCache: jest.Mocked<GameCacheService>;

    const SESSION_ID = 'session-123';
    const PLAYER_ID = 'player-1';
    const POSITION_X = 5;
    const POSITION_Y = 10;
    const SPEED = 3;
    const BOAT_SPEED = 2;
    const ACTIONS_REMAINING = 1;
    const HEALTH = 100;
    const TURN_NUMBER = 1;
    const ZERO = 0;
    const ONE = 1;
    const FOUR = 4;
    const ENEMY_PLAYER_ID = 'enemy-player-1';
    const BLOCKED_POSITION_X = 6;
    const BLOCKED_POSITION_Y = 10;

    const createMockPosition = (overrides: Partial<Position> = {}): Position => ({
        x: POSITION_X,
        y: POSITION_Y,
        ...overrides,
    });

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: PLAYER_ID,
        name: 'VP Player',
        avatar: null,
        isAdmin: false,
        baseHealth: HEALTH,
        healthBonus: ZERO,
        health: HEALTH,
        maxHealth: HEALTH,
        baseSpeed: SPEED,
        speedBonus: ZERO,
        speed: SPEED,
        boatSpeedBonus: BOAT_SPEED,
        boatSpeed: BOAT_SPEED,
        baseAttack: 10,
        attackBonus: ZERO,
        baseDefense: 5,
        defenseBonus: ZERO,
        attackDice: null,
        defenseDice: null,
        x: POSITION_X,
        y: POSITION_Y,
        isInGame: true,
        startPointId: '',
        actionsRemaining: ACTIONS_REMAINING,
        combatCount: ZERO,
        combatWins: ZERO,
        combatLosses: ZERO,
        combatDraws: ZERO,
        hasCombatBonus: false,
        virtualPlayerType: VirtualPlayerType.Offensive,
        ...overrides,
    });

    const createMockPathResult = (overrides: Partial<PathResult> = {}): PathResult => ({
        reachable: true,
        totalCost: ONE,
        actionsRequired: ONE,
        actions: [],
        destination: createMockPosition(),
        ...overrides,
    });

    const createMockPathAction = (overrides: Partial<PathAction> = {}): PathAction => ({
        type: PathActionType.MOVE,
        orientation: Orientation.N,
        position: createMockPosition(),
        ...overrides,
    });

    const createMockEvaluatedTarget = (overrides: Partial<EvaluatedTarget> = {}): EvaluatedTarget => ({
        type: PointOfInterestType.ENEMY,
        position: createMockPosition(),
        path: createMockPathResult(),
        priorityScore: 100,
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
            [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID }),
        },
        teams: {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- Team number must be numeric
            1: { number: ONE, playerIds: [PLAYER_ID] },
        },
        currentTurn: { turnNumber: TURN_NUMBER, activePlayerId: PLAYER_ID, hasUsedAction: false },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        turnOrder: [PLAYER_ID],
        playerCount: ONE,
        ...overrides,
    });

    beforeEach(async () => {
        const mockGameplayService = {
            movePlayer: jest.fn(),
            toggleDoorAction: jest.fn(),
            boardBoat: jest.fn(),
            disembarkBoat: jest.fn(),
            performSanctuaryAction: jest.fn(),
            pickUpFlag: jest.fn(),
            endPlayerTurn: jest.fn(),
        };

        const mockVPGameplayService = {
            makeDecision: jest.fn(),
        };

        const mockSessionRepository = {
            findById: jest.fn(),
        };

        const mockActionService = {
            attackPlayer: jest.fn(),
            getActiveCombat: jest.fn(),
        };

        const mockGameCache = {
            getNextPosition: jest.fn(),
            getTileOccupant: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VPExecutionService,
                {
                    provide: GameplayService,
                    useValue: mockGameplayService,
                },
                {
                    provide: VPGameplayService,
                    useValue: mockVPGameplayService,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockSessionRepository,
                },
                {
                    provide: ActionService,
                    useValue: mockActionService,
                },
                {
                    provide: GameCacheService,
                    useValue: mockGameCache,
                },
            ],
        }).compile();

        service = module.get<VPExecutionService>(VPExecutionService);
        gameplayService = module.get(GameplayService);
        vpGameplayService = module.get(VPGameplayService);
        sessionRepository = module.get(InGameSessionRepository);
        actionService = module.get(ActionService);
        gameCache = module.get(GameCacheService);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('executeVPTurn', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should end turn when player cannot act', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue({ playerAId: PLAYER_ID, playerBId: 'other-player' });

            service.executeVPTurn(SESSION_ID, PLAYER_ID, VirtualPlayerType.Offensive);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should end turn when decision has no target', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service.executeVPTurn(SESSION_ID, PLAYER_ID, VirtualPlayerType.Offensive);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should end turn when target path is not reachable', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ path: createMockPathResult({ reachable: false }) });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target, allEvaluatedTargets: [], useDoubleAction: false });

            service.executeVPTurn(SESSION_ID, PLAYER_ID, VirtualPlayerType.Offensive);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should execute path actions when target is valid', () => {
            const session = createMockSession();
            const action = createMockPathAction();
            const target = createMockEvaluatedTarget({ path: createMockPathResult({ actions: [action] }) });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target, allEvaluatedTargets: [], useDoubleAction: false });

            service.executeVPTurn(SESSION_ID, PLAYER_ID, VirtualPlayerType.Offensive);

            expect(gameplayService.movePlayer).toHaveBeenCalled();
        });
    });

    describe('continueOrEndTurn', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should return early when player is not valid', () => {
            sessionRepository.findById.mockReturnValue(null);

            service.continueOrEndTurn(SESSION_ID, PLAYER_ID);

            expect(vpGameplayService.makeDecision).not.toHaveBeenCalled();
        });

        it('should return early when player has no virtualPlayerType', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, virtualPlayerType: undefined }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);

            service.continueOrEndTurn(SESSION_ID, PLAYER_ID);

            expect(vpGameplayService.makeDecision).not.toHaveBeenCalled();
        });

        it('should return early when player is in combat', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue({ playerAId: PLAYER_ID, playerBId: 'other-player' });

            service.continueOrEndTurn(SESSION_ID, PLAYER_ID);

            expect(vpGameplayService.makeDecision).not.toHaveBeenCalled();
        });

        it('should end turn when player has no resources', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, speed: ZERO, boatSpeed: ZERO, actionsRemaining: ZERO }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service.continueOrEndTurn(SESSION_ID, PLAYER_ID);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should continue turn when player has speed', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service.continueOrEndTurn(SESSION_ID, PLAYER_ID);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);

            expect(vpGameplayService.makeDecision).toHaveBeenCalled();
        });

        it('should continue turn when player has boatSpeed', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, speed: ZERO, boatSpeed: BOAT_SPEED }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service.continueOrEndTurn(SESSION_ID, PLAYER_ID);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);

            expect(vpGameplayService.makeDecision).toHaveBeenCalled();
        });

        it('should continue turn when player has actionsRemaining', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, speed: ZERO, boatSpeed: ZERO, actionsRemaining: ACTIONS_REMAINING }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service.continueOrEndTurn(SESSION_ID, PLAYER_ID);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);

            expect(vpGameplayService.makeDecision).toHaveBeenCalled();
        });
    });

    describe('executePathActions', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should return early when player is not valid', () => {
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [], target, false);

            expect(gameplayService.movePlayer).not.toHaveBeenCalled();
        });

        it('should return early when player is in combat', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue({ playerAId: PLAYER_ID, playerBId: 'other-player' });

            service['executePathActions'](SESSION_ID, PLAYER_ID, [], target, false);

            expect(gameplayService.movePlayer).not.toHaveBeenCalled();
        });

        it('should perform target action when no remaining actions', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.ENEMY });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [], target, false);

            expect(actionService.attackPlayer).toHaveBeenCalled();
        });

        it('should end turn when cannot execute path action', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, speed: ZERO, boatSpeed: ZERO }),
                },
            });
            const action = createMockPathAction({ type: PathActionType.MOVE });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should end turn when action execution fails', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.MOVE });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            gameplayService.movePlayer.mockImplementation(() => {
                throw new Error('Test error');
            });

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should return when tryAttackBlockingEnemy succeeds', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: 2 }),
                },
                mode: GameMode.CLASSIC,
            });
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            gameplayService.movePlayer.mockImplementation(() => {
                throw new Error('Test error');
            });
            gameCache.getNextPosition.mockReturnValue({ x: BLOCKED_POSITION_X, y: BLOCKED_POSITION_Y });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(actionService.attackPlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, { x: BLOCKED_POSITION_X, y: BLOCKED_POSITION_Y });
            expect(gameplayService.endPlayerTurn).not.toHaveBeenCalled();
        });

        it('should end turn when tryAttackBlockingEnemy fails', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            gameplayService.movePlayer.mockImplementation(() => {
                throw new Error('Test error');
            });
            gameCache.getNextPosition.mockReturnValue({ x: BLOCKED_POSITION_X, y: BLOCKED_POSITION_Y });
            gameCache.getTileOccupant.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should execute move action with movement delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.MOVE });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.movePlayer).toHaveBeenCalled();
            jest.advanceTimersByTime(VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
        });

        it('should execute teleport action with movement delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.TELEPORT });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.movePlayer).toHaveBeenCalled();
            jest.advanceTimersByTime(VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
        });

        it('should execute openDoor action with action delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.OPENDOOR });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.toggleDoorAction).toHaveBeenCalled();
            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should execute boardBoat action with action delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.BOARDBOAT });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.boardBoat).toHaveBeenCalled();
            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should execute disembarkBoat action with action delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.DISEMBARKBOAT });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.disembarkBoat).toHaveBeenCalled();
            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });
    });

    describe('canExecutePathAction', () => {
        it('should return false when move action and no speed or boatSpeed', () => {
            const player = createMockPlayer({ speed: ZERO, boatSpeed: ZERO });
            const action = createMockPathAction({ type: PathActionType.MOVE });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(false);
        });

        it('should return true when move action and has speed', () => {
            const player = createMockPlayer({ speed: SPEED });
            const action = createMockPathAction({ type: PathActionType.MOVE });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return true when move action and has boatSpeed', () => {
            const player = createMockPlayer({ speed: ZERO, boatSpeed: BOAT_SPEED });
            const action = createMockPathAction({ type: PathActionType.MOVE });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return true when teleport action and has speed', () => {
            const player = createMockPlayer({ speed: SPEED });
            const action = createMockPathAction({ type: PathActionType.TELEPORT });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return false when teleport action and no speed or boatSpeed', () => {
            const player = createMockPlayer({ speed: ZERO, boatSpeed: ZERO });
            const action = createMockPathAction({ type: PathActionType.TELEPORT });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(false);
        });

        it('should return false when action action and no actionsRemaining', () => {
            const player = createMockPlayer({ actionsRemaining: ZERO });
            const action = createMockPathAction({ type: PathActionType.OPENDOOR });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(false);
        });

        it('should return true when action action and has actionsRemaining', () => {
            const player = createMockPlayer({ actionsRemaining: ACTIONS_REMAINING });
            const action = createMockPathAction({ type: PathActionType.OPENDOOR });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return true when boardBoat action and has actionsRemaining', () => {
            const player = createMockPlayer({ actionsRemaining: ACTIONS_REMAINING });
            const action = createMockPathAction({ type: PathActionType.BOARDBOAT });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return true when disembarkBoat action and has actionsRemaining', () => {
            const player = createMockPlayer({ actionsRemaining: ACTIONS_REMAINING });
            const action = createMockPathAction({ type: PathActionType.DISEMBARKBOAT });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });
    });

    describe('executeSingleAction', () => {
        it('should execute move action', () => {
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.movePlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, Orientation.N);
        });

        it('should execute move action without orientation', () => {
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: undefined });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.movePlayer).not.toHaveBeenCalled();
        });

        it('should execute teleport action without orientation', () => {
            const action = createMockPathAction({ type: PathActionType.TELEPORT, orientation: undefined });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.movePlayer).not.toHaveBeenCalled();
        });

        it('should execute teleport action', () => {
            const action = createMockPathAction({ type: PathActionType.TELEPORT, orientation: Orientation.S });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.movePlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, Orientation.S);
        });

        it('should execute openDoor action', () => {
            const position = createMockPosition();
            const action = createMockPathAction({ type: PathActionType.OPENDOOR, position });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.toggleDoorAction).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
        });

        it('should execute boardBoat action', () => {
            const position = createMockPosition();
            const action = createMockPathAction({ type: PathActionType.BOARDBOAT, position });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.boardBoat).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
        });

        it('should execute disembarkBoat action', () => {
            const position = createMockPosition();
            const action = createMockPathAction({ type: PathActionType.DISEMBARKBOAT, position });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.disembarkBoat).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
        });

        it('should return false for unknown action type', () => {
            const action = createMockPathAction({ type: 'unknown' as PathAction['type'] });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when action throws error', () => {
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            gameplayService.movePlayer.mockImplementation(() => {
                throw new Error('Test error');
            });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when openDoor action throws error', () => {
            const position = createMockPosition();
            const action = createMockPathAction({ type: PathActionType.OPENDOOR, position });
            gameplayService.toggleDoorAction.mockImplementation(() => {
                throw new Error('Test error');
            });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });
    });

    describe('tryAttackBlockingEnemy', () => {
        it('should return false when action type is not MOVE', () => {
            const action = createMockPathAction({ type: PathActionType.TELEPORT, orientation: Orientation.N });

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when action has no orientation', () => {
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: undefined });

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when player is not valid', () => {
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            sessionRepository.findById.mockReturnValue(null);

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when player has no actions remaining', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, actionsRemaining: ZERO }),
                },
            });
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            sessionRepository.findById.mockReturnValue(session);

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when no occupant found', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            sessionRepository.findById.mockReturnValue(session);
            gameCache.getNextPosition.mockReturnValue({ x: BLOCKED_POSITION_X, y: BLOCKED_POSITION_Y });
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when session is not found', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            sessionRepository.findById.mockReturnValueOnce(session).mockReturnValueOnce(null);
            gameCache.getNextPosition.mockReturnValue({ x: BLOCKED_POSITION_X, y: BLOCKED_POSITION_Y });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when occupant is not found', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID }),
                },
            });
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            sessionRepository.findById.mockReturnValue(session);
            gameCache.getNextPosition.mockReturnValue({ x: BLOCKED_POSITION_X, y: BLOCKED_POSITION_Y });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when occupant has no health', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, health: ZERO }),
                },
            });
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            sessionRepository.findById.mockReturnValue(session);
            gameCache.getNextPosition.mockReturnValue({ x: BLOCKED_POSITION_X, y: BLOCKED_POSITION_Y });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should return false when occupant is teammate in CTF mode', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, teamNumber: 1 }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: 1 }),
                },
            });
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            sessionRepository.findById.mockReturnValue(session);
            gameCache.getNextPosition.mockReturnValue({ x: BLOCKED_POSITION_X, y: BLOCKED_POSITION_Y });
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });

        it('should attack blocking enemy and return true', () => {
            const session = createMockSession({
                mode: GameMode.CLASSIC,
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, teamNumber: 1 }),
                    [ENEMY_PLAYER_ID]: createMockPlayer({ id: ENEMY_PLAYER_ID, teamNumber: 2 }),
                },
            });
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            const blockedPosition = { x: BLOCKED_POSITION_X, y: BLOCKED_POSITION_Y };
            sessionRepository.findById.mockReturnValue(session);
            gameCache.getNextPosition.mockReturnValue(blockedPosition);
            gameCache.getTileOccupant.mockReturnValue(ENEMY_PLAYER_ID);

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(actionService.attackPlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, blockedPosition);
        });

        it('should return false when exception is thrown', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: PathActionType.MOVE, orientation: Orientation.N });
            sessionRepository.findById.mockReturnValue(session);
            gameCache.getNextPosition.mockImplementation(() => {
                throw new Error('Test error');
            });

            const result = service['tryAttackBlockingEnemy'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });
    });

    describe('performTargetAction', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should return early when player is not valid', () => {
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.ENEMY });
            sessionRepository.findById.mockReturnValue(null);

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(actionService.attackPlayer).not.toHaveBeenCalled();
        });

        it('should return early when player is in combat', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.ENEMY });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue({ playerAId: PLAYER_ID, playerBId: 'other-player' });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(actionService.attackPlayer).not.toHaveBeenCalled();
        });

        it('should end turn when action required but no actionsRemaining', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, actionsRemaining: ZERO }),
                },
            });
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.ENEMY });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should attack enemy target', () => {
            const session = createMockSession();
            const position = createMockPosition();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.ENEMY, position });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(actionService.attackPlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
        });

        it('should attack flagCarrier target', () => {
            const session = createMockSession();
            const position = createMockPosition();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.FLAGCARRIER, position });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(actionService.attackPlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
        });

        it('should perform healSanctuary action', () => {
            const session = createMockSession();
            const position = createMockPosition();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.HEALSANCTUARY, position });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(gameplayService.performSanctuaryAction).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position, false);
            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should perform fightSanctuary action with useDoubleAction', () => {
            const session = createMockSession();
            const position = createMockPosition();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.FIGHTSANCTUARY, position });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, true);

            expect(gameplayService.performSanctuaryAction).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position, true);
            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should continue turn for flag target', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.FLAG });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should continue turn for escape target', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.ESCAPE });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should continue turn for guardPoint target', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.GUARDPOINT });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should continue turn for returnFlag target', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.RETURNFLAG });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should end turn when action throws error', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: PointOfInterestType.ENEMY });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            actionService.attackPlayer.mockImplementation(() => {
                throw new Error('Test error');
            });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });
    });

    describe('getValidPlayer', () => {
        it('should return null when session is not found', () => {
            sessionRepository.findById.mockReturnValue(null);

            const result = service['getValidPlayer'](SESSION_ID, PLAYER_ID);

            expect(result).toBeNull();
        });

        it('should return null when player is not found', () => {
            const session = createMockSession({ inGamePlayers: {} });
            sessionRepository.findById.mockReturnValue(session);

            const result = service['getValidPlayer'](SESSION_ID, PLAYER_ID);

            expect(result).toBeNull();
        });

        it('should return null when player health is zero', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, health: ZERO }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);

            const result = service['getValidPlayer'](SESSION_ID, PLAYER_ID);

            expect(result).toBeNull();
        });

        it('should return null when player is not in game', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ id: PLAYER_ID, isInGame: false }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);

            const result = service['getValidPlayer'](SESSION_ID, PLAYER_ID);

            expect(result).toBeNull();
        });

        it('should return null when player is not active turn', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: TURN_NUMBER, activePlayerId: 'other-player', hasUsedAction: false },
            });
            sessionRepository.findById.mockReturnValue(session);

            const result = service['getValidPlayer'](SESSION_ID, PLAYER_ID);

            expect(result).toBeNull();
        });

        it('should return player when valid', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            const result = service['getValidPlayer'](SESSION_ID, PLAYER_ID);

            expect(result).not.toBeNull();
            expect(result?.id).toBe(PLAYER_ID);
        });

        it('should return null when findById throws error', () => {
            sessionRepository.findById.mockImplementation(() => {
                throw new Error('Test error');
            });

            const result = service['getValidPlayer'](SESSION_ID, PLAYER_ID);

            expect(result).toBeNull();
        });
    });

    describe('canAct', () => {
        it('should return false when player is not valid', () => {
            sessionRepository.findById.mockReturnValue(null);

            const result = service['canAct'](SESSION_ID, PLAYER_ID);

            expect(result).toBe(false);
        });

        it('should return false when player is in combat', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue({ playerAId: PLAYER_ID, playerBId: 'other-player' });

            const result = service['canAct'](SESSION_ID, PLAYER_ID);

            expect(result).toBe(false);
        });

        it('should return true when player can act', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            const result = service['canAct'](SESSION_ID, PLAYER_ID);

            expect(result).toBe(true);
        });
    });

    describe('isInCombat', () => {
        it('should return true when combat is active', () => {
            actionService.getActiveCombat.mockReturnValue({ playerAId: PLAYER_ID, playerBId: 'other-player' });

            const result = service['isInCombat'](SESSION_ID);

            expect(result).toBe(true);
        });

        it('should return false when no combat is active', () => {
            actionService.getActiveCombat.mockReturnValue(null);

            const result = service['isInCombat'](SESSION_ID);

            expect(result).toBe(false);
        });
    });

    describe('endVPTurn', () => {
        it('should call endPlayerTurn', () => {
            service['endVPTurn'](SESSION_ID, PLAYER_ID);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should not throw when endPlayerTurn throws error', () => {
            gameplayService.endPlayerTurn.mockImplementation(() => {
                throw new Error('Test error');
            });

            expect(() => {
                service['endVPTurn'](SESSION_ID, PLAYER_ID);
            }).not.toThrow();
        });
    });
});
