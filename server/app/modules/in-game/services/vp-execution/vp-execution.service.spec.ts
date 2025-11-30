import { Test, TestingModule } from '@nestjs/testing';
import { VPExecutionService } from './vp-execution.service';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { VPGameplayService } from '@app/modules/in-game/services/vp-gameplay/vp-gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { VIRTUAL_PLAYER_ACTION_DELAY_MS, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS } from '@app/constants/virtual-player.constants';
import { EvaluatedTarget, VPDecision } from '@app/interfaces/vp-gameplay.interface';
import { PathAction, PathResult } from '@app/interfaces/vp-pathfinding.interface';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Position } from '@common/interfaces/position.interface';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

describe('VPExecutionService', () => {
    let service: VPExecutionService;
    let gameplayService: jest.Mocked<GameplayService>;
    let vpGameplayService: jest.Mocked<VPGameplayService>;
    let sessionRepository: jest.Mocked<InGameSessionRepository>;
    let actionService: jest.Mocked<ActionService>;

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
    const TWO = 2;
    const FOUR = 4;

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
        type: 'move',
        orientation: Orientation.N,
        position: createMockPosition(),
        ...overrides,
    });

    const createMockEvaluatedTarget = (overrides: Partial<EvaluatedTarget> = {}): EvaluatedTarget => ({
        type: 'enemy',
        position: createMockPosition(),
        path: createMockPathResult(),
        priorityScore: 100,
        ...overrides,
    });

    const createMockVPDecision = (overrides: Partial<VPDecision> = {}): VPDecision => ({
        target: createMockEvaluatedTarget(),
        allEvaluatedTargets: [],
        useDoubleAction: false,
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
            ],
        }).compile();

        service = module.get<VPExecutionService>(VPExecutionService);
        gameplayService = module.get(GameplayService);
        vpGameplayService = module.get(VPGameplayService);
        sessionRepository = module.get(InGameSessionRepository);
        actionService = module.get(ActionService);
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
            const target = createMockEvaluatedTarget({ type: 'enemy' });
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
            const action = createMockPathAction({ type: 'move' });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should end turn when action execution fails', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: 'move' });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            gameplayService.movePlayer.mockImplementation(() => {
                throw new Error('Test error');
            });

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should execute move action with movement delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: 'move' });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.movePlayer).toHaveBeenCalled();
            jest.advanceTimersByTime(VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
        });

        it('should execute teleport action with movement delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: 'teleport' });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.movePlayer).toHaveBeenCalled();
            jest.advanceTimersByTime(VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
        });

        it('should execute openDoor action with action delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: 'openDoor' });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.toggleDoorAction).toHaveBeenCalled();
            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should execute boardBoat action with action delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: 'boardBoat' });
            const target = createMockEvaluatedTarget();
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['executePathActions'](SESSION_ID, PLAYER_ID, [action], target, false);

            expect(gameplayService.boardBoat).toHaveBeenCalled();
            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should execute disembarkBoat action with action delay', () => {
            const session = createMockSession();
            const action = createMockPathAction({ type: 'disembarkBoat' });
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
            const action = createMockPathAction({ type: 'move' });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(false);
        });

        it('should return true when move action and has speed', () => {
            const player = createMockPlayer({ speed: SPEED });
            const action = createMockPathAction({ type: 'move' });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return true when move action and has boatSpeed', () => {
            const player = createMockPlayer({ speed: ZERO, boatSpeed: BOAT_SPEED });
            const action = createMockPathAction({ type: 'move' });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return true when teleport action and has speed', () => {
            const player = createMockPlayer({ speed: SPEED });
            const action = createMockPathAction({ type: 'teleport' });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return false when action action and no actionsRemaining', () => {
            const player = createMockPlayer({ actionsRemaining: ZERO });
            const action = createMockPathAction({ type: 'openDoor' });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(false);
        });

        it('should return true when action action and has actionsRemaining', () => {
            const player = createMockPlayer({ actionsRemaining: ACTIONS_REMAINING });
            const action = createMockPathAction({ type: 'openDoor' });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return true when boardBoat action and has actionsRemaining', () => {
            const player = createMockPlayer({ actionsRemaining: ACTIONS_REMAINING });
            const action = createMockPathAction({ type: 'boardBoat' });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });

        it('should return true when disembarkBoat action and has actionsRemaining', () => {
            const player = createMockPlayer({ actionsRemaining: ACTIONS_REMAINING });
            const action = createMockPathAction({ type: 'disembarkBoat' });

            const result = service['canExecutePathAction'](player, action);

            expect(result).toBe(true);
        });
    });

    describe('executeSingleAction', () => {
        it('should execute move action', () => {
            const action = createMockPathAction({ type: 'move', orientation: Orientation.N });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.movePlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, Orientation.N);
        });

        it('should execute teleport action', () => {
            const action = createMockPathAction({ type: 'teleport', orientation: Orientation.S });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.movePlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, Orientation.S);
        });

        it('should execute openDoor action', () => {
            const position = createMockPosition();
            const action = createMockPathAction({ type: 'openDoor', position });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.toggleDoorAction).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
        });

        it('should execute boardBoat action', () => {
            const position = createMockPosition();
            const action = createMockPathAction({ type: 'boardBoat', position });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(true);
            expect(gameplayService.boardBoat).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
        });

        it('should execute disembarkBoat action', () => {
            const position = createMockPosition();
            const action = createMockPathAction({ type: 'disembarkBoat', position });

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
            const action = createMockPathAction({ type: 'move', orientation: Orientation.N });
            gameplayService.movePlayer.mockImplementation(() => {
                throw new Error('Test error');
            });

            const result = service['executeSingleAction'](SESSION_ID, PLAYER_ID, action);

            expect(result).toBe(false);
        });
    });

    describe('performTargetAction', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should return early when player is not valid', () => {
            const target = createMockEvaluatedTarget({ type: 'enemy' });
            sessionRepository.findById.mockReturnValue(null);

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(actionService.attackPlayer).not.toHaveBeenCalled();
        });

        it('should return early when player is in combat', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: 'enemy' });
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
            const target = createMockEvaluatedTarget({ type: 'enemy' });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(gameplayService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should attack enemy target', () => {
            const session = createMockSession();
            const position = createMockPosition();
            const target = createMockEvaluatedTarget({ type: 'enemy', position });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(actionService.attackPlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
        });

        it('should attack flagCarrier target', () => {
            const session = createMockSession();
            const position = createMockPosition();
            const target = createMockEvaluatedTarget({ type: 'flagCarrier', position });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(actionService.attackPlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
        });

        it('should perform healSanctuary action', () => {
            const session = createMockSession();
            const position = createMockPosition();
            const target = createMockEvaluatedTarget({ type: 'healSanctuary', position });
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
            const target = createMockEvaluatedTarget({ type: 'fightSanctuary', position });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, true);

            expect(gameplayService.performSanctuaryAction).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position, true);
            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should pick up flag target', () => {
            const session = createMockSession();
            const position = createMockPosition();
            const target = createMockEvaluatedTarget({ type: 'flag', position });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            expect(gameplayService.pickUpFlag).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, position);
            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should continue turn for escape target', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: 'escape' });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should continue turn for guardPoint target', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: 'guardPoint' });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should continue turn for returnFlag target', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: 'returnFlag' });
            sessionRepository.findById.mockReturnValue(session);
            actionService.getActiveCombat.mockReturnValue(null);
            vpGameplayService.makeDecision.mockReturnValue({ target: null, allEvaluatedTargets: [], useDoubleAction: false });

            service['performTargetAction'](SESSION_ID, PLAYER_ID, target, false);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);
        });

        it('should end turn when action throws error', () => {
            const session = createMockSession();
            const target = createMockEvaluatedTarget({ type: 'enemy' });
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

    describe('logPath', () => {
        it('should log path when target has actions', () => {
            const action = createMockPathAction({ type: 'move', orientation: Orientation.N });
            const target = createMockEvaluatedTarget({ path: createMockPathResult({ actions: [action] }) });
            const decision: VPDecision = { target, allEvaluatedTargets: [], useDoubleAction: false };
            const loggerSpy = jest.spyOn(service['logger'], 'debug');

            service['logPath'](decision);

            expect(loggerSpy).toHaveBeenCalled();
        });

        it('should not log when target has no actions', () => {
            const target = createMockEvaluatedTarget({ path: createMockPathResult({ actions: [] }) });
            const decision: VPDecision = { target, allEvaluatedTargets: [], useDoubleAction: false };
            const loggerSpy = jest.spyOn(service['logger'], 'debug');

            service['logPath'](decision);

            expect(loggerSpy).not.toHaveBeenCalled();
        });

        it('should not log when target is null', () => {
            const decision: VPDecision = { target: null, allEvaluatedTargets: [], useDoubleAction: false };
            const loggerSpy = jest.spyOn(service['logger'], 'debug');

            service['logPath'](decision);

            expect(loggerSpy).not.toHaveBeenCalled();
        });
    });
});

