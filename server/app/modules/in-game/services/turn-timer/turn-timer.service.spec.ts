/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { ServerEvents } from '@app/enums/server-events.enum';
import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { TurnState } from '@common/interfaces/turn-state.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { TurnTimerService } from './turn-timer.service';

describe('TurnTimerService', () => {
    let service: TurnTimerService;
    let eventEmitter: jest.Mocked<EventEmitter2>;
    let sessionRepository: jest.Mocked<InGameSessionRepository>;
    let gameCache: jest.Mocked<GameCacheService>;

    const SESSION_ID = 'session-123';
    const PLAYER_ID_1 = 'player-1';
    const PLAYER_ID_2 = 'player-2';
    const PLAYER_ID_3 = 'player-3';
    const TIMEOUT_MS = 5000;
    const TURN_NUMBER_1 = 1;
    const BASE_SPEED = 3;
    const SPEED_BONUS = 1;
    const BOAT_SPEED_BONUS = 2;
    const ATTACK_BONUS = 5;
    const DEFENSE_BONUS = 3;
    const ACTIONS_REMAINING = 1;
    const ZERO = 0;
    const ONE = 1;
    const TWO = 2;
    const FOUR = 4;

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: PLAYER_ID_1,
        name: 'Player One',
        avatar: null,
        isAdmin: false,
        baseHealth: 100,
        healthBonus: ZERO,
        health: 100,
        maxHealth: 100,
        baseSpeed: BASE_SPEED,
        speedBonus: SPEED_BONUS,
        speed: BASE_SPEED + SPEED_BONUS,
        boatSpeedBonus: BOAT_SPEED_BONUS,
        boatSpeed: BOAT_SPEED_BONUS,
        baseAttack: 10,
        attackBonus: ATTACK_BONUS,
        baseDefense: 5,
        defenseBonus: DEFENSE_BONUS,
        attackDice: null,
        defenseDice: null,
        x: 0,
        y: 0,
        isInGame: true,
        startPointId: '',
        actionsRemaining: ACTIONS_REMAINING,
        combatCount: ZERO,
        combatWins: ZERO,
        combatLosses: ZERO,
        combatDraws: ZERO,
        hasCombatBonus: false,
        ...overrides,
    });

    const createMockTurnState = (overrides: Partial<TurnState> = {}): TurnState => ({
        turnNumber: TURN_NUMBER_1,
        activePlayerId: PLAYER_ID_1,
        hasUsedAction: false,
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
            [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1 }),
            [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2 }),
        },
        teams: {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- Team number must be numeric
            1: { number: ONE, playerIds: [PLAYER_ID_1, PLAYER_ID_2] },
        },
        currentTurn: createMockTurnState(),
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        turnOrder: [PLAYER_ID_1, PLAYER_ID_2],
        playerCount: TWO,
        ...overrides,
    });

    beforeEach(async () => {
        const mockEventEmitter = {
            emit: jest.fn(),
        };

        const mockSessionRepository = {
            findById: jest.fn(),
            updatePlayer: jest.fn(),
            resetPlayerBonuses: jest.fn(),
        };

        const mockGameCache = {
            decrementDisabledPlaceablesTurnCount: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TurnTimerService,
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitter,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockSessionRepository,
                },
                {
                    provide: GameCacheService,
                    useValue: mockGameCache,
                },
            ],
        }).compile();

        service = module.get<TurnTimerService>(TurnTimerService);
        eventEmitter = module.get(EventEmitter2);
        sessionRepository = module.get(InGameSessionRepository);
        gameCache = module.get(GameCacheService);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('startFirstTurnWithTransition', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should throw error when turnOrder is empty', () => {
            const session = createMockSession({ turnOrder: [] });

            expect(() => {
                service.startFirstTurnWithTransition(session);
            }).toThrow('TURN_ORDER_NOT_DEFINED');
        });

        it('should throw error when turnOrder is undefined', () => {
            const session = createMockSession({ turnOrder: undefined as unknown as string[] });

            expect(() => {
                service.startFirstTurnWithTransition(session);
            }).toThrow('TURN_ORDER_NOT_DEFINED');
        });

        it('should throw error when no active player found', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, isInGame: false }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: false }),
                },
            });

            expect(() => {
                service.startFirstTurnWithTransition(session);
            }).toThrow('NO_ACTIVE_PLAYER');
        });

        it('should initialize first turn and set game timer state to TurnTransition', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            const result = service.startFirstTurnWithTransition(session);

            expect(result.turnNumber).toBe(TURN_NUMBER_1);
            expect(result.activePlayerId).toBe(PLAYER_ID_1);
            expect(result.hasUsedAction).toBe(false);
            expect(session.currentTurn).toEqual(result);
            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.TurnTransition);
        });

        it('should set player speed and boatSpeed correctly', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);

            expect(session.inGamePlayers[PLAYER_ID_1].speed).toBe(BASE_SPEED + SPEED_BONUS);
            expect(session.inGamePlayers[PLAYER_ID_1].boatSpeed).toBe(BOAT_SPEED_BONUS);
        });

        it('should emit events and update state after transition duration', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(sessionRepository.updatePlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID_1, { actionsRemaining: ACTIONS_REMAINING });
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.TurnTransition, { session });
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.TurnStarted, { session });
            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should set hasCombatBonus when player has attack bonus', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.inGamePlayers[PLAYER_ID_1].hasCombatBonus).toBe(true);
        });

        it('should set hasCombatBonus when player has defense bonus', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, attackBonus: ZERO, defenseBonus: DEFENSE_BONUS }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2 }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.inGamePlayers[PLAYER_ID_1].hasCombatBonus).toBe(true);
        });

        it('should not set hasCombatBonus when player has no bonuses', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, attackBonus: ZERO, defenseBonus: ZERO }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2 }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.inGamePlayers[PLAYER_ID_1].hasCombatBonus).toBe(false);
        });

        it('should use custom timeout when provided', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session, TIMEOUT_MS);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(jest.getTimerCount()).toBeGreaterThan(ZERO);
        });

        it('should clear timer when session not found in timeout callback', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValueOnce(session).mockReturnValueOnce(null);

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should clear timer when error occurs in timeout callback', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.updatePlayer.mockImplementation(() => {
                throw new Error('Test error');
            });

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should trigger virtual player turn when player is virtual', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, virtualPlayerType: VirtualPlayerType.Offensive }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2 }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.VirtualPlayerTurn, {
                sessionId: SESSION_ID,
                playerId: PLAYER_ID_1,
                playerType: VirtualPlayerType.Offensive,
            });
        });
    });

    describe('endTurnManual', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should clear turn timer and emit TurnManualEnd event', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.TurnManualEnd, { session });
        });

        it('should proceed to next turn', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(sessionRepository.findById).toHaveBeenCalled();
        });
    });

    describe('getGameTimerState', () => {
        it('should return PlayerTurn as default when no state is set', () => {
            const state = service.getGameTimerState('non-existent-session');

            expect(state).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should return set state', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);

            const state = service.getGameTimerState(SESSION_ID);

            expect(state).toBe(TurnTimerStates.TurnTransition);
        });
    });

    describe('pauseTurnTimer', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should pause timer and set state to CombatTurn', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.pauseTurnTimer(SESSION_ID);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.CombatTurn);
        });

        it('should not pause when timer does not exist', () => {
            service.pauseTurnTimer('non-existent-session');

            expect(service.getGameTimerState('non-existent-session')).toBe(TurnTimerStates.PlayerTurn);
        });
    });

    describe('resumeTurnTimer', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should resume timer and set state to PlayerTurn', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            service.pauseTurnTimer(SESSION_ID);

            service.resumeTurnTimer(SESSION_ID);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should not resume when timer does not exist', () => {
            service.resumeTurnTimer('non-existent-session');

            expect(service.getGameTimerState('non-existent-session')).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should not resume when timer is already running', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            const timerCountBefore = jest.getTimerCount();
            service.resumeTurnTimer(SESSION_ID);
            const timerCountAfter = jest.getTimerCount();

            expect(timerCountBefore).toBe(timerCountAfter);
        });
    });

    describe('forceStopTimer', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should stop timer', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            const timerCountBefore = jest.getTimerCount();
            service.forceStopTimer(SESSION_ID);
            const timerCountAfter = jest.getTimerCount();

            expect(timerCountAfter).toBeLessThan(timerCountBefore);
        });

        it('should not throw error when timer does not exist', () => {
            expect(() => {
                service.forceStopTimer('non-existent-session');
            }).not.toThrow();
        });
    });

    describe('clearTimerForSession', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should clear timer and game timer state', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.clearTimerForSession(SESSION_ID);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });
    });

    describe('nextTurn', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should proceed to next turn when called via endTurnManual', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(sessionRepository.findById).toHaveBeenCalled();
            expect(gameCache.decrementDisabledPlaceablesTurnCount).toHaveBeenCalledWith(SESSION_ID);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.TurnEnded, expect.objectContaining({ session }));
        });

        it('should reset previous player speed to zero', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(session.inGamePlayers[PLAYER_ID_1].speed).toBe(ZERO);
        });

        it('should reset player bonuses when hasCombatBonus is true', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            session.inGamePlayers[PLAYER_ID_1].hasCombatBonus = true;

            service.endTurnManual(session);

            expect(sessionRepository.resetPlayerBonuses).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID_1);
        });

        it('should emit PlayerReachableTiles event with empty array', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerReachableTiles, {
                playerId: PLAYER_ID_1,
                reachable: [],
            });
        });

        it('should increment turn number', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            const previousTurnNumber = session.currentTurn.turnNumber;
            service.endTurnManual(session);

            expect(session.currentTurn.turnNumber).toBe(previousTurnNumber + ONE);
        });

        it('should set next player as active', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(session.currentTurn.activePlayerId).toBe(PLAYER_ID_2);
        });

        it('should set next player speed and boatSpeed', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(session.inGamePlayers[PLAYER_ID_2].speed).toBe(BASE_SPEED + SPEED_BONUS);
            expect(session.inGamePlayers[PLAYER_ID_2].boatSpeed).toBe(BOAT_SPEED_BONUS);
        });

        it('should clear timer when session not found', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValueOnce(session).mockReturnValueOnce(null);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(() => {
                service.endTurnManual(session);
            }).toThrow('Failed to proceed to next turn');

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should wrap around to first player when at end of turn order', () => {
            const session = createMockSession({
                currentTurn: createMockTurnState({ activePlayerId: PLAYER_ID_2 }),
            });
            sessionRepository.findById.mockReturnValue(session);

            service.endTurnManual(session);

            expect(session.currentTurn.activePlayerId).toBe(PLAYER_ID_1);
        });

        it('should skip inactive players', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1 }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: false }),
                    [PLAYER_ID_3]: createMockPlayer({ id: PLAYER_ID_3 }),
                },
                turnOrder: [PLAYER_ID_1, PLAYER_ID_2, PLAYER_ID_3],
            });
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(session.currentTurn.activePlayerId).toBe(PLAYER_ID_3);
        });

        it('should use first player in turn order when current player not found', () => {
            const nonExistentPlayerId = 'non-existent-player';
            const session = createMockSession({
                currentTurn: createMockTurnState({ activePlayerId: nonExistentPlayerId }),
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1 }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2 }),
                    [nonExistentPlayerId]: createMockPlayer({ id: nonExistentPlayerId }),
                },
            });
            sessionRepository.findById.mockReturnValue(session);

            service.endTurnManual(session);

            expect(session.currentTurn.activePlayerId).toBe(PLAYER_ID_1);
        });

        it('should clear timer when session not found in setTimeout callback', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            service.endTurnManual(session);

            sessionRepository.findById.mockReturnValueOnce(null);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should clear timer when error occurs in setTimeout callback', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.updatePlayer.mockImplementationOnce(() => {
                throw new Error('Test error');
            });

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should return newTurn from nextTurn', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            const previousTurn = session.currentTurn;
            service.endTurnManual(session);

            expect(session.currentTurn.turnNumber).toBe(previousTurn.turnNumber + ONE);
            expect(session.currentTurn.activePlayerId).toBeDefined();
        });
    });

    describe('autoEndTurn', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should auto end turn after timeout', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            const previousTurnNumber = session.currentTurn.turnNumber;
            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            expect(session.currentTurn.turnNumber).toBe(previousTurnNumber + ONE);
        });

        it('should clear timer when session not found', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValueOnce(session).mockReturnValueOnce(null);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should clear timer when error occurs', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.findById.mockImplementationOnce(() => {
                throw new Error('Test error');
            });

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });
    });

    describe('getNextActivePlayer', () => {
        it('should return first active player when currentId is null', () => {
            const session = createMockSession();

            const result = service.startFirstTurnWithTransition(session);

            expect(result.activePlayerId).toBe(PLAYER_ID_1);
        });

        it('should return next active player in order', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(session.currentTurn.activePlayerId).toBe(PLAYER_ID_2);
        });

        it('should skip inactive players', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1 }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: false }),
                    [PLAYER_ID_3]: createMockPlayer({ id: PLAYER_ID_3 }),
                },
                turnOrder: [PLAYER_ID_1, PLAYER_ID_2, PLAYER_ID_3],
            });
            sessionRepository.findById.mockReturnValue(session);

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.endTurnManual(session);

            expect(session.currentTurn.activePlayerId).toBe(PLAYER_ID_3);
        });

        it('should return null when no active players', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, isInGame: false }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: false }),
                },
            });

            expect(() => {
                service.startFirstTurnWithTransition(session);
            }).toThrow('NO_ACTIVE_PLAYER');
        });

        it('should wrap around to beginning of turn order', () => {
            const session = createMockSession({
                currentTurn: createMockTurnState({ activePlayerId: PLAYER_ID_2 }),
            });
            sessionRepository.findById.mockReturnValue(session);

            service.endTurnManual(session);

            expect(session.currentTurn.activePlayerId).toBe(PLAYER_ID_1);
        });

        it('should return null when turnOrder is empty', () => {
            const session = createMockSession({ turnOrder: [] });

            const result = (service as unknown as {
                getNextActivePlayer: (session: InGameSession, currentId: string | null) => string | null;
            }).getNextActivePlayer(session, null);

            expect(result).toBeNull();
        });

        it('should set startIdx to 0 when currentId is not found in turnOrder', () => {
            const session = createMockSession({
                turnOrder: [PLAYER_ID_1, PLAYER_ID_2],
            });

            const result = (service as unknown as {
                getNextActivePlayer: (session: InGameSession, currentId: string | null) => string | null;
            }).getNextActivePlayer(session, 'non-existent-player');

            expect(result).toBe(PLAYER_ID_1);
        });

        it('should return playerId when player is active and not checked', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, isInGame: true }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: true }),
                },
                turnOrder: [PLAYER_ID_1, PLAYER_ID_2],
            });

            const result = (service as unknown as {
                getNextActivePlayer: (session: InGameSession, currentId: string | null) => string | null;
            }).getNextActivePlayer(session, PLAYER_ID_1);

            expect(result).toBe(PLAYER_ID_2);
        });

        it('should use first player in turnOrder when getNextActivePlayer returns null', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, isInGame: false }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: false }),
                },
                turnOrder: [PLAYER_ID_1, PLAYER_ID_2],
            });
            sessionRepository.findById.mockReturnValue(session);

            service.endTurnManual(session);

            expect(session.currentTurn.activePlayerId).toBe(PLAYER_ID_1);
        });
    });

    describe('triggerVirtualPlayerTurn', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should clear timer when error occurs', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, virtualPlayerType: VirtualPlayerType.Offensive }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2 }),
                },
            });
            sessionRepository.findById.mockImplementationOnce(() => {
                throw new Error('Test error');
            });

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(service.getGameTimerState(SESSION_ID)).toBe(TurnTimerStates.PlayerTurn);
        });
    });
});
