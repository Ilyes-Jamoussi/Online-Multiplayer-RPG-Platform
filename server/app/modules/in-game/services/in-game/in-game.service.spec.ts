/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameActionService } from '@app/modules/in-game/services/in-game-action/in-game-action.service';
import { InGameInitializationService } from '@app/modules/in-game/services/in-game-initialization/in-game-initialization.service';
import { InGameMovementService } from '@app/modules/in-game/services/in-game-movement/in-game-movement.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession, WaitingRoomSession } from '@common/interfaces/session.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { InGameService } from './in-game.service';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { CombatTimerService } from '@app/modules/in-game/services/combat-timer/combat-timer.service';

describe('InGameService', () => {
    let service: InGameService;
    let timerService: jest.Mocked<TimerService>;
    let gameCache: jest.Mocked<GameCacheService>;
    let initialization: jest.Mocked<InGameInitializationService>;
    let sessionRepository: jest.Mocked<InGameSessionRepository>;
    let movementService: jest.Mocked<InGameMovementService>;
    let actionService: jest.Mocked<InGameActionService>;
    let combatService: jest.Mocked<CombatService>;
    let combatTimerService: jest.Mocked<CombatTimerService>;

    const SESSION_ID = 'session-123';
    const GAME_ID = 'game-456';
    const PLAYER_A_ID = 'player-a';
    const PLAYER_B_ID = 'player-b';
    const PLAYER_C_ID = 'player-c';

    const BASE_SPEED = 3;
    const BASE_HEALTH = 100;
    const BASE_ATTACK = 10;
    const BASE_DEFENSE = 5;
    const SPEED_BONUS = 2;
    const HEALTH_BONUS = 0;
    const TELEPORT_X = 5;
    const TELEPORT_Y = 5;
    const DOOR_X = 2;
    const DOOR_Y = 3;

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: PLAYER_A_ID,
        name: 'Player A',
        avatar: Avatar.Avatar1,
        isAdmin: false,
        baseHealth: BASE_HEALTH,
        healthBonus: HEALTH_BONUS,
        health: BASE_HEALTH,
        maxHealth: BASE_HEALTH,
        baseSpeed: BASE_SPEED,
        speedBonus: 0,
        speed: BASE_SPEED,
        baseAttack: BASE_ATTACK,
        attackBonus: 0,
        attack: BASE_ATTACK,
        baseDefense: BASE_DEFENSE,
        defenseBonus: 0,
        defense: BASE_DEFENSE,
        attackDice: Dice.D6,
        defenseDice: Dice.D4,
        x: 0,
        y: 0,
        isInGame: false,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
        ...overrides,
    });

    const createMockWaitingSession = (overrides: Partial<WaitingRoomSession> = {}): WaitingRoomSession => ({
        id: SESSION_ID,
        gameId: GAME_ID,
        maxPlayers: 4,
        players: [
            createMockPlayer({ id: PLAYER_A_ID, name: 'Player A', avatar: Avatar.Avatar1 }),
            createMockPlayer({ id: PLAYER_B_ID, name: 'Player B', avatar: Avatar.Avatar2 }),
        ],
        avatarAssignments: [],
        isRoomLocked: false,
        ...overrides,
    });

    const createMockInGameSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: SESSION_ID,
        inGameId: `${SESSION_ID}-${GAME_ID}`,
        gameId: GAME_ID,
        maxPlayers: 4,
        isGameStarted: false,
        inGamePlayers: {
            [PLAYER_A_ID]: createMockPlayer({ id: PLAYER_A_ID, name: 'Player A' }),
            [PLAYER_B_ID]: createMockPlayer({ id: PLAYER_B_ID, name: 'Player B' }),
        },
        currentTurn: { turnNumber: 1, activePlayerId: PLAYER_A_ID, hasUsedAction: false },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
        isAdminModeActive: false,
        ...overrides,
    });

    const createMockGame = (overrides: Partial<Game> = {}): Game => ({
        _id: new Types.ObjectId(),
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

    beforeEach(async () => {
        const mockTimerService = {
            startFirstTurnWithTransition: jest.fn(),
            endTurnManual: jest.fn(),
            forceStopTimer: jest.fn(),
            getGameTimerState: jest.fn(),
            clearTimerForSession: jest.fn(),
        };

        const mockGameCache = {
            fetchAndCacheGame: jest.fn(),
            isTileFree: jest.fn(),
            clearSessionGameCache: jest.fn(),
        };

        const mockInitialization = {
            makeTurnOrder: jest.fn(),
            assignStartPoints: jest.fn(),
        };

        const mockSessionRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            updatePlayer: jest.fn(),
            playerLeave: jest.fn(),
            inGamePlayersCount: jest.fn(),
            findSessionByPlayerId: jest.fn(),
            movePlayerPosition: jest.fn(),
            delete: jest.fn(),
        };

        const mockMovementService = {
            movePlayer: jest.fn(),
            calculateReachableTiles: jest.fn(),
        };

        const mockActionService = {
            toggleDoor: jest.fn(),
            calculateAvailableActions: jest.fn(),
        };

        const mockCombatService = {
            clearActiveCombatForSession: jest.fn(),
        };

        const mockCombatTimerService = {
            stopCombatTimer: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InGameService,
                {
                    provide: TimerService,
                    useValue: mockTimerService,
                },
                {
                    provide: GameCacheService,
                    useValue: mockGameCache,
                },
                {
                    provide: InGameInitializationService,
                    useValue: mockInitialization,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockSessionRepository,
                },
                {
                    provide: InGameMovementService,
                    useValue: mockMovementService,
                },
                {
                    provide: InGameActionService,
                    useValue: mockActionService,
                },
                {
                    provide: CombatService,
                    useValue: mockCombatService,
                },
                {
                    provide: CombatTimerService,
                    useValue: mockCombatTimerService,
                },
            ],
        }).compile();

        service = module.get<InGameService>(InGameService);
        timerService = module.get(TimerService);
        gameCache = module.get(GameCacheService);
        initialization = module.get(InGameInitializationService);
        sessionRepository = module.get(InGameSessionRepository);
        movementService = module.get(InGameMovementService);
        actionService = module.get(InGameActionService);
        combatService = module.get(CombatService);
        combatTimerService = module.get(CombatTimerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createInGameSession', () => {
        it('should create a new in-game session', async () => {
            const waitingSession = createMockWaitingSession();
            const mockGame = createMockGame();
            const turnOrder = [PLAYER_A_ID, PLAYER_B_ID];

            gameCache.fetchAndCacheGame.mockResolvedValue(mockGame);
            initialization.makeTurnOrder.mockReturnValue(turnOrder);

            const result = await service.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.MEDIUM);

            expect(result.id).toBe(SESSION_ID);
            expect(result.gameId).toBe(GAME_ID);
            expect(result.mapSize).toBe(MapSize.MEDIUM);
            expect(result.mode).toBe(GameMode.CLASSIC);
            expect(result.isGameStarted).toBe(false);
            expect(gameCache.fetchAndCacheGame).toHaveBeenCalledWith(SESSION_ID, GAME_ID);
            expect(initialization.makeTurnOrder).toHaveBeenCalledWith(waitingSession.players);
            expect(initialization.assignStartPoints).toHaveBeenCalled();
            expect(sessionRepository.save).toHaveBeenCalled();
        });

        it('should set turn order from initialization service', async () => {
            const waitingSession = createMockWaitingSession();
            const mockGame = createMockGame();
            const turnOrder = [PLAYER_B_ID, PLAYER_A_ID];

            gameCache.fetchAndCacheGame.mockResolvedValue(mockGame);
            initialization.makeTurnOrder.mockReturnValue(turnOrder);

            const result = await service.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.MEDIUM);

            expect(result.turnOrder).toEqual(turnOrder);
        });

        it('should create inGamePlayers from waiting room players', async () => {
            const waitingSession = createMockWaitingSession();
            const mockGame = createMockGame();
            const turnOrder = [PLAYER_A_ID, PLAYER_B_ID];

            gameCache.fetchAndCacheGame.mockResolvedValue(mockGame);
            initialization.makeTurnOrder.mockReturnValue(turnOrder);

            const result = await service.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.MEDIUM);

            expect(result.inGamePlayers[PLAYER_A_ID]).toBeDefined();
            expect(result.inGamePlayers[PLAYER_B_ID]).toBeDefined();
            expect(result.inGamePlayers[PLAYER_A_ID].x).toBe(0);
            expect(result.inGamePlayers[PLAYER_A_ID].y).toBe(0);
            expect(result.inGamePlayers[PLAYER_A_ID].startPointId).toBe('');
        });

        it('should set activePlayerId to first player in turn order', async () => {
            const waitingSession = createMockWaitingSession();
            const mockGame = createMockGame();
            const turnOrder = [PLAYER_B_ID, PLAYER_A_ID];

            gameCache.fetchAndCacheGame.mockResolvedValue(mockGame);
            initialization.makeTurnOrder.mockReturnValue(turnOrder);

            const result = await service.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.MEDIUM);

            expect(result.currentTurn.activePlayerId).toBe(PLAYER_B_ID);
        });

        it('should set speed for first player when player exists', async () => {
            const waitingSession = createMockWaitingSession();
            const mockGame = createMockGame();
            const turnOrder = [PLAYER_A_ID, PLAYER_B_ID];

            gameCache.fetchAndCacheGame.mockResolvedValue(mockGame);
            initialization.makeTurnOrder.mockReturnValue(turnOrder);

            const result = await service.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.MEDIUM);

            expect(result.inGamePlayers[PLAYER_A_ID].speed).toBe(BASE_SPEED + 0);
        });

        it('should set speed with bonus for first player', async () => {
            const waitingSession = createMockWaitingSession({
                players: [createMockPlayer({ id: PLAYER_A_ID, speedBonus: SPEED_BONUS }), createMockPlayer({ id: PLAYER_B_ID })],
            });
            const mockGame = createMockGame();
            const turnOrder = [PLAYER_A_ID, PLAYER_B_ID];

            gameCache.fetchAndCacheGame.mockResolvedValue(mockGame);
            initialization.makeTurnOrder.mockReturnValue(turnOrder);

            const result = await service.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.MEDIUM);

            expect(result.inGamePlayers[PLAYER_A_ID].speed).toBe(BASE_SPEED + SPEED_BONUS);
        });

        it('should not set speed when first player does not exist', async () => {
            const waitingSession = createMockWaitingSession();
            const mockGame = createMockGame();
            const turnOrder = ['non-existent-player', PLAYER_B_ID];

            gameCache.fetchAndCacheGame.mockResolvedValue(mockGame);
            initialization.makeTurnOrder.mockReturnValue(turnOrder);

            const result = await service.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.MEDIUM);

            expect(result.currentTurn.activePlayerId).toBe('non-existent-player');
            expect(result.inGamePlayers['non-existent-player']).toBeUndefined();
        });

        it('should assign start points', async () => {
            const waitingSession = createMockWaitingSession();
            const mockGame = createMockGame();
            const turnOrder = [PLAYER_A_ID, PLAYER_B_ID];

            gameCache.fetchAndCacheGame.mockResolvedValue(mockGame);
            initialization.makeTurnOrder.mockReturnValue(turnOrder);

            await service.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.MEDIUM);

            expect(initialization.assignStartPoints).toHaveBeenCalled();
        });

        it('should save session to repository', async () => {
            const waitingSession = createMockWaitingSession();
            const mockGame = createMockGame();
            const turnOrder = [PLAYER_A_ID, PLAYER_B_ID];

            gameCache.fetchAndCacheGame.mockResolvedValue(mockGame);
            initialization.makeTurnOrder.mockReturnValue(turnOrder);

            await service.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.MEDIUM);

            expect(sessionRepository.save).toHaveBeenCalled();
        });
    });

    describe('getSession', () => {
        it('should return session from repository', () => {
            const session = createMockInGameSession();
            sessionRepository.findById.mockReturnValue(session);

            const result = service.getSession(SESSION_ID);

            expect(result).toBe(session);
            expect(sessionRepository.findById).toHaveBeenCalledWith(SESSION_ID);
        });

        it('should return undefined when session not found', () => {
            sessionRepository.findById.mockReturnValue(undefined);

            const result = service.getSession('non-existent');

            expect(result).toBeUndefined();
        });
    });

    describe('joinInGameSession', () => {
        it('should allow player to join session', () => {
            const session = createMockInGameSession();
            sessionRepository.findById.mockReturnValue(session);

            const result = service.joinInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(sessionRepository.updatePlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID, { isInGame: true });
            expect(result).toBe(session);
        });

        it('should throw NotFoundException if player not found', () => {
            const session = createMockInGameSession();
            session.inGamePlayers = {};
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.joinInGameSession(SESSION_ID, PLAYER_C_ID)).toThrow(NotFoundException);
            expect(() => service.joinInGameSession(SESSION_ID, PLAYER_C_ID)).toThrow('Player not found');
        });

        it('should throw BadRequestException if player already joined', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_A_ID].isInGame = true;
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.joinInGameSession(SESSION_ID, PLAYER_A_ID)).toThrow(BadRequestException);
            expect(() => service.joinInGameSession(SESSION_ID, PLAYER_A_ID)).toThrow('Player already joined');
        });

        it('should start session when all players joined and game not started', () => {
            const initialSession = createMockInGameSession();
            initialSession.inGamePlayers[PLAYER_B_ID].isInGame = true;
            sessionRepository.findById.mockReturnValue(initialSession);
            timerService.startFirstTurnWithTransition.mockReturnValue({ turnNumber: 1, activePlayerId: PLAYER_A_ID, hasUsedAction: false });

            type ServiceWithPrivateMethod = {
                startSessionWithTransition: (sessionId: string) => InGameSession;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            const startSessionSpy = jest.spyOn(servicePrivate, 'startSessionWithTransition');

            const updatedSession = createMockInGameSession();
            updatedSession.inGamePlayers[PLAYER_A_ID].isInGame = true;
            updatedSession.inGamePlayers[PLAYER_B_ID].isInGame = true;

            sessionRepository.findById.mockReturnValueOnce(initialSession).mockReturnValueOnce(updatedSession).mockReturnValueOnce(updatedSession);

            service.joinInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(startSessionSpy).toHaveBeenCalledWith(SESSION_ID);
        });

        it('should not start session when game already started', () => {
            const session = createMockInGameSession({ isGameStarted: true });
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                startSessionWithTransition: (sessionId: string) => InGameSession;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            const startSessionSpy = jest.spyOn(servicePrivate, 'startSessionWithTransition');

            service.joinInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(startSessionSpy).not.toHaveBeenCalled();
        });

        it('should not start session when not all players joined', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_C_ID] = createMockPlayer({ id: PLAYER_C_ID, isInGame: false });
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                startSessionWithTransition: (sessionId: string) => InGameSession;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            const startSessionSpy = jest.spyOn(servicePrivate, 'startSessionWithTransition');

            service.joinInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(startSessionSpy).not.toHaveBeenCalled();
        });

        it('should return updated session', () => {
            const session = createMockInGameSession();
            sessionRepository.findById.mockReturnValue(session);

            const result = service.joinInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(result).toBe(session);
        });
    });

    describe('endPlayerTurn', () => {
        it('should end turn when it is player turn', () => {
            const session = createMockInGameSession();
            sessionRepository.findById.mockReturnValue(session);

            const result = service.endPlayerTurn(SESSION_ID, PLAYER_A_ID);

            expect(timerService.endTurnManual).toHaveBeenCalledWith(session);
            expect(result).toBe(session);
        });

        it('should throw BadRequestException if not player turn', () => {
            const session = createMockInGameSession();
            session.currentTurn.activePlayerId = PLAYER_B_ID;
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.endPlayerTurn(SESSION_ID, PLAYER_A_ID)).toThrow(BadRequestException);
            expect(() => service.endPlayerTurn(SESSION_ID, PLAYER_A_ID)).toThrow('Not your turn');
        });
    });

    describe('toggleDoorAction', () => {
        it('should toggle door and decrement actions', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = 1;
            sessionRepository.findById.mockReturnValue(session);
            movementService.calculateReachableTiles.mockReturnValue([]);

            service.toggleDoorAction(SESSION_ID, PLAYER_A_ID, DOOR_X, DOOR_Y);

            expect(actionService.toggleDoor).toHaveBeenCalledWith(session, PLAYER_A_ID, DOOR_X, DOOR_Y);
            expect(session.inGamePlayers[PLAYER_A_ID].actionsRemaining).toBe(0);
            expect(session.currentTurn.hasUsedAction).toBe(true);
            expect(movementService.calculateReachableTiles).toHaveBeenCalledWith(session, PLAYER_A_ID);
        });

        it('should throw NotFoundException if player not found', () => {
            const session = createMockInGameSession();
            session.inGamePlayers = {};
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.toggleDoorAction(SESSION_ID, PLAYER_A_ID, DOOR_X, DOOR_Y)).toThrow(NotFoundException);
            expect(() => service.toggleDoorAction(SESSION_ID, PLAYER_A_ID, DOOR_X, DOOR_Y)).toThrow('Player not found');
        });

        it('should throw BadRequestException if no actions remaining', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = 0;
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.toggleDoorAction(SESSION_ID, PLAYER_A_ID, DOOR_X, DOOR_Y)).toThrow(BadRequestException);
            expect(() => service.toggleDoorAction(SESSION_ID, PLAYER_A_ID, DOOR_X, DOOR_Y)).toThrow('No actions remaining');
        });

        it('should end turn when no actions and no speed remaining', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = 1;
            const NO_SPEED = 0;
            session.inGamePlayers[PLAYER_A_ID].speed = NO_SPEED;
            sessionRepository.findById.mockReturnValue(session);
            movementService.calculateReachableTiles.mockReturnValue([]);

            service.toggleDoorAction(SESSION_ID, PLAYER_A_ID, DOOR_X, DOOR_Y);

            expect(timerService.endTurnManual).toHaveBeenCalledWith(session);
        });

        it('should not end turn when actions or speed remaining', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = 1;
            session.inGamePlayers[PLAYER_A_ID].speed = BASE_SPEED;
            sessionRepository.findById.mockReturnValue(session);
            movementService.calculateReachableTiles.mockReturnValue([]);

            service.toggleDoorAction(SESSION_ID, PLAYER_A_ID, DOOR_X, DOOR_Y);

            expect(timerService.endTurnManual).not.toHaveBeenCalled();
        });

        it('should not end turn when actions remaining', () => {
            const session = createMockInGameSession();
            const ACTIONS_REMAINING = 2;
            const NO_SPEED = 0;
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = ACTIONS_REMAINING;
            session.inGamePlayers[PLAYER_A_ID].speed = NO_SPEED;
            sessionRepository.findById.mockReturnValue(session);
            movementService.calculateReachableTiles.mockReturnValue([]);

            service.toggleDoorAction(SESSION_ID, PLAYER_A_ID, DOOR_X, DOOR_Y);

            expect(timerService.endTurnManual).not.toHaveBeenCalled();
        });
    });

    describe('movePlayer', () => {
        it('should move player and end turn when no speed and no actions', () => {
            const session = createMockInGameSession();
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            sessionRepository.findById.mockReturnValue(session);
            timerService.getGameTimerState.mockReturnValue(TurnTimerStates.PlayerTurn);
            movementService.movePlayer.mockReturnValue(0);
            actionService.calculateAvailableActions.mockReturnValue([]);

            service.movePlayer(SESSION_ID, PLAYER_A_ID, Orientation.N);

            expect(movementService.movePlayer).toHaveBeenCalledWith(session, PLAYER_A_ID, Orientation.N);
            expect(actionService.calculateAvailableActions).toHaveBeenCalledWith(session, PLAYER_A_ID);
            expect(timerService.endTurnManual).toHaveBeenCalledWith(session);
        });

        it('should throw BadRequestException if not player turn (activePlayerId check)', () => {
            const session = createMockInGameSession();
            session.currentTurn.activePlayerId = PLAYER_B_ID;
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.movePlayer(SESSION_ID, PLAYER_A_ID, Orientation.N)).toThrow(BadRequestException);
            expect(() => service.movePlayer(SESSION_ID, PLAYER_A_ID, Orientation.N)).toThrow('Not your turn');
        });

        it('should throw BadRequestException if not player turn (timer state check)', () => {
            const session = createMockInGameSession();
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            sessionRepository.findById.mockReturnValue(session);
            timerService.getGameTimerState.mockReturnValue(TurnTimerStates.TurnTransition);

            expect(() => service.movePlayer(SESSION_ID, PLAYER_A_ID, Orientation.N)).toThrow(BadRequestException);
            expect(() => service.movePlayer(SESSION_ID, PLAYER_A_ID, Orientation.N)).toThrow('Not your turn');
        });

        it('should not end turn when speed remaining', () => {
            const session = createMockInGameSession();
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            sessionRepository.findById.mockReturnValue(session);
            timerService.getGameTimerState.mockReturnValue(TurnTimerStates.PlayerTurn);
            movementService.movePlayer.mockReturnValue(2);
            actionService.calculateAvailableActions.mockReturnValue([]);

            service.movePlayer(SESSION_ID, PLAYER_A_ID, Orientation.N);

            expect(timerService.endTurnManual).not.toHaveBeenCalled();
        });

        it('should not end turn when actions available', () => {
            const session = createMockInGameSession();
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            sessionRepository.findById.mockReturnValue(session);
            timerService.getGameTimerState.mockReturnValue(TurnTimerStates.PlayerTurn);
            movementService.movePlayer.mockReturnValue(0);
            actionService.calculateAvailableActions.mockReturnValue([{ type: 'ATTACK', x: 1, y: 1 }]);

            service.movePlayer(SESSION_ID, PLAYER_A_ID, Orientation.N);

            expect(timerService.endTurnManual).not.toHaveBeenCalled();
        });
    });

    describe('leaveInGameSession', () => {
        it('should allow player to leave and return session info', () => {
            const session = createMockInGameSession();
            const player = createMockPlayer({ id: PLAYER_A_ID, name: 'Player A' });
            sessionRepository.playerLeave.mockReturnValue(player);
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.inGamePlayersCount.mockReturnValue(2);

            const result = service.leaveInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(result.session).toBe(session);
            expect(result.playerName).toBe('Player A');
            expect(result.playerId).toBe(PLAYER_A_ID);
            expect(result.sessionEnded).toBe(false);
            expect(result.adminModeDeactivated).toBe(false);
        });

        it('should deactivate admin mode when admin leaves and admin mode is active', () => {
            const session = createMockInGameSession({ isAdminModeActive: true });
            const player = createMockPlayer({ id: PLAYER_A_ID, isAdmin: true });
            sessionRepository.playerLeave.mockReturnValue(player);
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.inGamePlayersCount.mockReturnValue(2);

            const result = service.leaveInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(result.adminModeDeactivated).toBe(true);
            expect(session.isAdminModeActive).toBe(false);
            expect(sessionRepository.update).toHaveBeenCalledWith(session);
        });

        it('should not deactivate admin mode when non-admin leaves', () => {
            const session = createMockInGameSession({ isAdminModeActive: true });
            const player = createMockPlayer({ id: PLAYER_A_ID, isAdmin: false });
            sessionRepository.playerLeave.mockReturnValue(player);
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.inGamePlayersCount.mockReturnValue(2);

            const result = service.leaveInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(result.adminModeDeactivated).toBe(false);
            expect(session.isAdminModeActive).toBe(true);
        });

        it('should not deactivate admin mode when admin leaves but admin mode inactive', () => {
            const session = createMockInGameSession({ isAdminModeActive: false });
            const player = createMockPlayer({ id: PLAYER_A_ID, isAdmin: true });
            sessionRepository.playerLeave.mockReturnValue(player);
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.inGamePlayersCount.mockReturnValue(2);

            const result = service.leaveInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(result.adminModeDeactivated).toBe(false);
        });

        it('should end session when less than 2 players remain', () => {
            const session = createMockInGameSession();
            const player = createMockPlayer({ id: PLAYER_A_ID });
            sessionRepository.playerLeave.mockReturnValue(player);
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.inGamePlayersCount.mockReturnValue(1);

            const result = service.leaveInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(result.sessionEnded).toBe(true);
            expect(timerService.forceStopTimer).toHaveBeenCalledWith(SESSION_ID);
        });

        it('should not end session when 2 or more players remain', () => {
            const session = createMockInGameSession();
            const player = createMockPlayer({ id: PLAYER_A_ID });
            sessionRepository.playerLeave.mockReturnValue(player);
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.inGamePlayersCount.mockReturnValue(2);

            const result = service.leaveInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(result.sessionEnded).toBe(false);
            expect(timerService.forceStopTimer).not.toHaveBeenCalled();
        });

        it('should end turn when leaving player is active player', () => {
            const session = createMockInGameSession();
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            const player = createMockPlayer({ id: PLAYER_A_ID });
            sessionRepository.playerLeave.mockReturnValue(player);
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.inGamePlayersCount.mockReturnValue(2);

            service.leaveInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(timerService.endTurnManual).toHaveBeenCalledWith(session);
        });

        it('should not end turn when leaving player is not active player', () => {
            const session = createMockInGameSession();
            session.currentTurn.activePlayerId = PLAYER_B_ID;
            const player = createMockPlayer({ id: PLAYER_A_ID });
            sessionRepository.playerLeave.mockReturnValue(player);
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.inGamePlayersCount.mockReturnValue(2);

            service.leaveInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(timerService.endTurnManual).not.toHaveBeenCalled();
        });

        it('should not end turn when session ends', () => {
            const session = createMockInGameSession();
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            const player = createMockPlayer({ id: PLAYER_A_ID });
            sessionRepository.playerLeave.mockReturnValue(player);
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.inGamePlayersCount.mockReturnValue(1);

            service.leaveInGameSession(SESSION_ID, PLAYER_A_ID);

            expect(timerService.endTurnManual).not.toHaveBeenCalled();
        });
    });

    describe('findSessionByPlayerId', () => {
        it('should return session from repository', () => {
            const session = createMockInGameSession();
            sessionRepository.findSessionByPlayerId.mockReturnValue(session);

            const result = service.findSessionByPlayerId(PLAYER_A_ID);

            expect(result).toBe(session);
            expect(sessionRepository.findSessionByPlayerId).toHaveBeenCalledWith(PLAYER_A_ID);
        });

        it('should return null when session not found', () => {
            sessionRepository.findSessionByPlayerId.mockReturnValue(null);

            const result = service.findSessionByPlayerId(PLAYER_A_ID);

            expect(result).toBeNull();
        });
    });

    describe('getReachableTiles', () => {
        it('should calculate reachable tiles and end turn when none and no actions', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = 0;
            sessionRepository.findById.mockReturnValue(session);
            movementService.calculateReachableTiles.mockReturnValue([]);

            service.getReachableTiles(SESSION_ID, PLAYER_A_ID);

            expect(movementService.calculateReachableTiles).toHaveBeenCalledWith(session, PLAYER_A_ID);
            expect(timerService.endTurnManual).toHaveBeenCalledWith(session);
        });

        it('should not end turn when reachable tiles exist', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = 0;
            sessionRepository.findById.mockReturnValue(session);
            movementService.calculateReachableTiles.mockReturnValue([{ x: 1, y: 1, cost: 1, remainingPoints: 2 }]);

            service.getReachableTiles(SESSION_ID, PLAYER_A_ID);

            expect(timerService.endTurnManual).not.toHaveBeenCalled();
        });

        it('should not end turn when actions remaining', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = 1;
            sessionRepository.findById.mockReturnValue(session);
            movementService.calculateReachableTiles.mockReturnValue([]);

            service.getReachableTiles(SESSION_ID, PLAYER_A_ID);

            expect(timerService.endTurnManual).not.toHaveBeenCalled();
        });
    });

    describe('getAvailableActions', () => {
        it('should calculate available actions', () => {
            const session = createMockInGameSession();
            sessionRepository.findById.mockReturnValue(session);
            actionService.calculateAvailableActions.mockReturnValue([{ type: 'ATTACK', x: 1, y: 1 }]);

            service.getAvailableActions(SESSION_ID, PLAYER_A_ID);

            expect(actionService.calculateAvailableActions).toHaveBeenCalledWith(session, PLAYER_A_ID);
        });
    });

    describe('toggleAdminMode', () => {
        it('should toggle admin mode when player is admin', () => {
            const session = createMockInGameSession({ isAdminModeActive: false });
            session.inGamePlayers[PLAYER_A_ID].isAdmin = true;
            sessionRepository.findById.mockReturnValue(session);

            const result = service.toggleAdminMode(SESSION_ID, PLAYER_A_ID);

            expect(result.isAdminModeActive).toBe(true);
            expect(sessionRepository.update).toHaveBeenCalledWith(session);
            expect(result).toBe(session);
        });

        it('should deactivate admin mode when already active', () => {
            const session = createMockInGameSession({ isAdminModeActive: true });
            session.inGamePlayers[PLAYER_A_ID].isAdmin = true;
            sessionRepository.findById.mockReturnValue(session);

            const result = service.toggleAdminMode(SESSION_ID, PLAYER_A_ID);

            expect(result.isAdminModeActive).toBe(false);
        });

        it('should throw NotFoundException if player not found', () => {
            const session = createMockInGameSession();
            session.inGamePlayers = {};
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.toggleAdminMode(SESSION_ID, PLAYER_A_ID)).toThrow(NotFoundException);
            expect(() => service.toggleAdminMode(SESSION_ID, PLAYER_A_ID)).toThrow('Player not found');
        });

        it('should throw BadRequestException if player is not admin', () => {
            const session = createMockInGameSession();
            session.inGamePlayers[PLAYER_A_ID].isAdmin = false;
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.toggleAdminMode(SESSION_ID, PLAYER_A_ID)).toThrow(BadRequestException);
            expect(() => service.toggleAdminMode(SESSION_ID, PLAYER_A_ID)).toThrow('Only admin can toggle admin mode');
        });
    });

    describe('teleportPlayer', () => {
        it('should teleport player when admin mode active and player turn', () => {
            const session = createMockInGameSession({ isAdminModeActive: true });
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            sessionRepository.findById.mockReturnValue(session);
            gameCache.isTileFree.mockReturnValue(true);
            movementService.calculateReachableTiles.mockReturnValue([]);
            actionService.calculateAvailableActions.mockReturnValue([]);

            service.teleportPlayer(SESSION_ID, PLAYER_A_ID, TELEPORT_X, TELEPORT_Y);

            const NO_COST = 0;
            expect(gameCache.isTileFree).toHaveBeenCalledWith(SESSION_ID, TELEPORT_X, TELEPORT_Y);
            expect(sessionRepository.movePlayerPosition).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID, TELEPORT_X, TELEPORT_Y, NO_COST);
            expect(movementService.calculateReachableTiles).toHaveBeenCalledWith(session, PLAYER_A_ID);
            expect(actionService.calculateAvailableActions).toHaveBeenCalledWith(session, PLAYER_A_ID);
        });

        it('should throw BadRequestException if admin mode not active', () => {
            const session = createMockInGameSession({ isAdminModeActive: false });
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.teleportPlayer(SESSION_ID, PLAYER_A_ID, TELEPORT_X, TELEPORT_Y)).toThrow(BadRequestException);
            expect(() => service.teleportPlayer(SESSION_ID, PLAYER_A_ID, TELEPORT_X, TELEPORT_Y)).toThrow('Admin mode not active');
        });

        it('should throw BadRequestException if not player turn', () => {
            const session = createMockInGameSession({ isAdminModeActive: true });
            session.currentTurn.activePlayerId = PLAYER_B_ID;
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.teleportPlayer(SESSION_ID, PLAYER_A_ID, TELEPORT_X, TELEPORT_Y)).toThrow(BadRequestException);
            expect(() => service.teleportPlayer(SESSION_ID, PLAYER_A_ID, TELEPORT_X, TELEPORT_Y)).toThrow('Not your turn');
        });

        it('should throw BadRequestException if tile is not free', () => {
            const session = createMockInGameSession({ isAdminModeActive: true });
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            sessionRepository.findById.mockReturnValue(session);
            gameCache.isTileFree.mockReturnValue(false);

            expect(() => service.teleportPlayer(SESSION_ID, PLAYER_A_ID, TELEPORT_X, TELEPORT_Y)).toThrow(BadRequestException);
            expect(() => service.teleportPlayer(SESSION_ID, PLAYER_A_ID, TELEPORT_X, TELEPORT_Y)).toThrow('Tile is not free');
        });
    });

    describe('startSessionWithTransition', () => {
        it('should start session with transition', () => {
            const session = createMockInGameSession({ isGameStarted: false });
            sessionRepository.findById.mockReturnValue(session);
            timerService.startFirstTurnWithTransition.mockReturnValue({ turnNumber: 1, activePlayerId: PLAYER_A_ID, hasUsedAction: false });

            type ServiceWithPrivateMethod = {
                startSessionWithTransition: (sessionId: string) => InGameSession;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.startSessionWithTransition(SESSION_ID);

            expect(result.isGameStarted).toBe(true);
            expect(timerService.startFirstTurnWithTransition).toHaveBeenCalledWith(session, DEFAULT_TURN_DURATION);
            expect(result.currentTurn).toEqual({ turnNumber: 1, activePlayerId: PLAYER_A_ID, hasUsedAction: false });
        });

        it('should throw BadRequestException if game already started', () => {
            const session = createMockInGameSession({ isGameStarted: true });
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                startSessionWithTransition: (sessionId: string) => InGameSession;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            expect(() => servicePrivate.startSessionWithTransition(SESSION_ID)).toThrow(BadRequestException);
            expect(() => servicePrivate.startSessionWithTransition(SESSION_ID)).toThrow('Game already started');
        });
    });

    describe('removeSession', () => {
        it('should remove session and clear all related caches', () => {
            const session = createMockInGameSession();
            sessionRepository.findById.mockReturnValue(session);

            service.removeSession(SESSION_ID);

            expect(sessionRepository.findById).toHaveBeenCalledWith(SESSION_ID);
            expect(sessionRepository.delete).toHaveBeenCalledWith(SESSION_ID);
            expect(gameCache.clearSessionGameCache).toHaveBeenCalledWith(SESSION_ID);
            expect(combatService.clearActiveCombatForSession).toHaveBeenCalledWith(SESSION_ID);
            expect(combatTimerService.stopCombatTimer).toHaveBeenCalledWith(session);
            expect(timerService.clearTimerForSession).toHaveBeenCalledWith(SESSION_ID);
        });

        it('should throw NotFoundException when session not found', () => {
            sessionRepository.findById.mockImplementation(() => {
                throw new NotFoundException('Session not found');
            });

            expect(() => service.removeSession(SESSION_ID)).toThrow(NotFoundException);
        });
    });
});
