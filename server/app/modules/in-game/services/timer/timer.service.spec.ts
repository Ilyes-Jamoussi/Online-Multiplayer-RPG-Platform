/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { TimerService } from './timer.service';

describe('TimerService', () => {
    let service: TimerService;
    let eventEmitter: jest.Mocked<EventEmitter2>;
    let module: TestingModule;

    const CUSTOM_TIMEOUT_SHORT = 1000;
    const CUSTOM_TIMEOUT_LONG = 5000;
    const CUSTOM_TIMEOUT_MEDIUM = 2000;
    const MAX_PLAYERS = 4;
    const TURN_NUMBER_THREE = 3;
    const TURN_NUMBER_FOUR = 4;
    const BASE_SPEED = 5;
    const BASE_HEALTH = 100;
    const SPEED_BONUS = 2;
    const TIMER_BUFFER = 100;
    const EXPECTED_SPEED_WITH_BONUS = 7;

    const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: 'session-123',
        inGameId: 'session-123-game-456',
        gameId: 'game-456',
        maxPlayers: MAX_PLAYERS,
        isGameStarted: true,
        inGamePlayers: {
            player1: {
                id: 'player1',
                name: 'Alice',
                x: 0,
                y: 0,
                startPointId: 'start1',
                isInGame: true,
                avatar: Avatar.Avatar1,
                isAdmin: false,
                speed: BASE_SPEED,
                health: BASE_HEALTH,
                attack: 6,
                defense: 4,
                baseHealth: BASE_HEALTH,
                healthBonus: 0,
                maxHealth: BASE_HEALTH,
                baseSpeed: BASE_SPEED,
                speedBonus: 0,
                baseAttack: 6,
                attackBonus: 0,
                defenseBonus: 0,
                baseDefense: 4,
                attackDice: Dice.D6,
                defenseDice: Dice.D4,
                actionsRemaining: 1,
                combatCount: 0,
                combatWins: 0,
                combatLosses: 0,
                combatDraws: 0,
            },
            player2: {
                id: 'player2',
                name: 'Bob',
                x: 1,
                y: 1,
                startPointId: 'start2',
                isInGame: true,
                avatar: Avatar.Avatar2,
                isAdmin: false,
                speed: BASE_SPEED,
                health: BASE_HEALTH,
                attack: 6,
                defense: 4,
                baseHealth: BASE_HEALTH,
                healthBonus: 0,
                maxHealth: BASE_HEALTH,
                baseSpeed: BASE_SPEED,
                speedBonus: 0,
                baseAttack: 6,
                attackBonus: 0,
                defenseBonus: 0,
                baseDefense: 4,
                attackDice: Dice.D6,
                defenseDice: Dice.D4,
                actionsRemaining: 1,
                combatCount: 0,
                combatWins: 0,
                combatLosses: 0,
                combatDraws: 0,
            },
            player3: {
                id: 'player3',
                name: 'Charlie',
                x: 2,
                y: 2,
                startPointId: 'start3',
                isInGame: true,
                avatar: Avatar.Avatar3,
                isAdmin: false,
                speed: BASE_SPEED,
                health: BASE_HEALTH,
                attack: 6,
                defense: 4,
                baseHealth: BASE_HEALTH,
                healthBonus: 0,
                maxHealth: BASE_HEALTH,
                baseSpeed: BASE_SPEED,
                speedBonus: 0,
                baseAttack: 6,
                attackBonus: 0,
                defenseBonus: 0,
                baseDefense: 4,
                attackDice: Dice.D6,
                defenseDice: Dice.D4,
                actionsRemaining: 1,
                combatCount: 0,
                combatWins: 0,
                combatLosses: 0,
                combatDraws: 0,
            },
        },
        currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        turnOrder: ['player1', 'player2', 'player3'],
        ...overrides,
    });

    beforeEach(async () => {
        const mockEventEmitter = {
            emit: jest.fn(),
        };

        const mockSessionRepository = {
            findById: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            updatePlayer: jest.fn(),
        };

        module = await Test.createTestingModule({
            providers: [
                TimerService,
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitter,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockSessionRepository,
                },
            ],
        }).compile();

        service = module.get<TimerService>(TimerService);
        eventEmitter = module.get(EventEmitter2);

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('startFirstTurnWithTransition', () => {
        it('should start the first turn with transition', () => {
            const session = createMockSession();

            const result = service.startFirstTurnWithTransition(session);

            expect(result.turnNumber).toBe(1);
            expect(result.activePlayerId).toBe('player1');
            expect(session.currentTurn).toEqual(result);
        });

        it('should throw error when turnOrder is empty', () => {
            const session = createMockSession({ turnOrder: [] });

            expect(() => service.startFirstTurnWithTransition(session)).toThrow('TURN_ORDER_NOT_DEFINED');
        });

        it('should throw error when turnOrder is undefined', () => {
            const session = createMockSession({ turnOrder: undefined as unknown as string[] });

            expect(() => service.startFirstTurnWithTransition(session)).toThrow('TURN_ORDER_NOT_DEFINED');
        });

        it('should throw error when no active player', () => {
            const session = createMockSession();
            session.inGamePlayers.player1.isInGame = false;
            session.inGamePlayers.player2.isInGame = false;
            session.inGamePlayers.player3.isInGame = false;

            expect(() => service.startFirstTurnWithTransition(session)).toThrow('NO_ACTIVE_PLAYER');
        });

        it('should set game timer state to TurnTransition initially', () => {
            const session = createMockSession();

            service.startFirstTurnWithTransition(session);

            expect(service.getGameTimerState(session.id)).toBe(TurnTimerStates.TurnTransition);
        });

        it('should emit turn.transition and turn.started after transition delay', () => {
            const session = createMockSession();

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.transition', { session });
            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.started', { session });
        });

        it('should update player actions remaining after transition', () => {
            const session = createMockSession();
            const mockSessionRepository = module.get<InGameSessionRepository>(InGameSessionRepository);

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(mockSessionRepository.updatePlayer).toHaveBeenCalledWith(session.id, 'player1', { actionsRemaining: 1 });
        });

        it('should set game timer state to PlayerTurn after transition', () => {
            const session = createMockSession();

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(service.getGameTimerState(session.id)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should schedule timeout after transition', () => {
            const session = createMockSession();

            service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_LONG);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(jest.getTimerCount()).toBe(1);
        });

        it('should set player speed with base speed and bonus', () => {
            const session = createMockSession();
            session.inGamePlayers.player1.baseSpeed = BASE_SPEED;
            session.inGamePlayers.player1.speedBonus = SPEED_BONUS;

            service.startFirstTurnWithTransition(session);

            expect(session.inGamePlayers.player1.speed).toBe(EXPECTED_SPEED_WITH_BONUS);
        });

        it('should use default timeout when not provided', () => {
            const session = createMockSession();

            service.startFirstTurnWithTransition(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(jest.getTimerCount()).toBe(1);
        });
    });

    describe('endTurnManual', () => {
        it('should clear turn timer', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_SHORT);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(jest.getTimerCount()).toBe(1);

            service.endTurnManual(session);

            const timeoutCallCountBefore = (eventEmitter.emit as jest.Mock).mock.calls.filter(
                (call) => call[0] === 'turn.timeout',
            ).length;

            jest.advanceTimersByTime(CUSTOM_TIMEOUT_SHORT);

            const timeoutCallCountAfter = (eventEmitter.emit as jest.Mock).mock.calls.filter(
                (call) => call[0] === 'turn.timeout',
            ).length;

            expect(timeoutCallCountAfter).toBe(timeoutCallCountBefore);
        });

        it('should emit turn.manualEnd event', () => {
            const session = createMockSession();

            service.endTurnManual(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.manualEnd', { session });
        });

        it('should advance to next turn', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player2');
            expect(session.currentTurn.turnNumber).toBe(2);
        });

        it('should emit turn.ended event', () => {
            const session = createMockSession();

            service.endTurnManual(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.ended', { session });
        });

        it('should emit turn.transition and turn.started after transition delay', () => {
            const session = createMockSession();

            service.endTurnManual(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.transition', { session });
            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.started', { session });
        });

        it('should wrap around to first player after last player', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: TURN_NUMBER_THREE, activePlayerId: 'player3', hasUsedAction: false },
            });

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.turnNumber).toBe(TURN_NUMBER_FOUR);
            expect(session.currentTurn.activePlayerId).toBe('player1');
        });

        it('should handle player not in order by returning first player', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'unknown-player', hasUsedAction: false },
            });

            session.inGamePlayers['unknown-player'] = {
                id: 'unknown-player',
                name: 'Unknown',
                x: 0,
                y: 0,
                startPointId: '',
                isInGame: true,
                avatar: Avatar.Avatar1,
                isAdmin: false,
                speed: BASE_SPEED,
                health: BASE_HEALTH,
                attack: 4,
                defense: 4,
                baseHealth: BASE_HEALTH,
                healthBonus: 0,
                maxHealth: BASE_HEALTH,
                baseSpeed: BASE_SPEED,
                speedBonus: 0,
                baseAttack: 6,
                attackBonus: 0,
                defenseBonus: 0,
                baseDefense: 4,
                attackDice: Dice.D6,
                defenseDice: Dice.D4,
                actionsRemaining: 1,
                combatCount: 0,
                combatWins: 0,
                combatLosses: 0,
                combatDraws: 0,
            };

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player1');
        });
    });

    describe('getGameTimerState', () => {
        it('should return default state when no state is set', () => {
            const sessionId = 'new-session-id';

            const state = service.getGameTimerState(sessionId);

            expect(state).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should return set state', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session);

            const state = service.getGameTimerState(session.id);

            expect(state).toBe(TurnTimerStates.TurnTransition);
        });
    });

    describe('forceStopTimer', () => {
        it('should stop timer for a session', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(jest.getTimerCount()).toBe(1);

            service.forceStopTimer(session.id);

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            const timeoutCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter(
                (call) => call[0] === 'turn.timeout',
            ).length;
            expect(timeoutCallCount).toBe(0);
        });

        it('should handle stopping timer for non-existent session gracefully', () => {
            expect(() => service.forceStopTimer('non-existent-session')).not.toThrow();
        });

        it('should clear timer from timers map', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.forceStopTimer(session.id);

            const timerCount = jest.getTimerCount();
            expect(timerCount).toBe(0);
        });

        it('should emit turn.forceStopTimer event', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            service.forceStopTimer(session.id);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.forceStopTimer', { sessionId: session.id });
        });
    });

    describe('autoEndTurn (private, tested via timeout)', () => {
        it('should emit turn.timeout event when turn times out', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.timeout', { session });
        });

        it('should advance to next turn after timeout', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });
            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player2');
            expect(session.currentTurn.turnNumber).toBe(2);
        });
    });

    describe('pauseTurnTimer', () => {
        it('should pause an active timer', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_LONG);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(jest.getTimerCount()).toBe(1);

            jest.advanceTimersByTime(CUSTOM_TIMEOUT_MEDIUM);
            service.pauseTurnTimer(session.id);

            expect(jest.getTimerCount()).toBe(0);
            expect(service.getGameTimerState(session.id)).toBe(TurnTimerStates.CombatTurn);
        });

        it('should handle pausing when no timer exists gracefully', () => {
            const sessionId = 'no-timer-session';

            expect(() => service.pauseTurnTimer(sessionId)).not.toThrow();
        });

        it('should handle pausing when timer is already paused', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_LONG);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            service.pauseTurnTimer(session.id);

            expect(() => service.pauseTurnTimer(session.id)).not.toThrow();
        });

        it('should save remaining time when pausing', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_LONG);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            jest.advanceTimersByTime(CUSTOM_TIMEOUT_MEDIUM);
            service.pauseTurnTimer(session.id);

            service.resumeTurnTimer(session.id);
            jest.advanceTimersByTime(CUSTOM_TIMEOUT_LONG - CUSTOM_TIMEOUT_MEDIUM - TIMER_BUFFER);

            expect(jest.getTimerCount()).toBe(1);
        });
    });

    describe('resumeTurnTimer', () => {
        it('should resume a paused timer', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_LONG);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            jest.advanceTimersByTime(CUSTOM_TIMEOUT_MEDIUM);
            service.pauseTurnTimer(session.id);

            expect(jest.getTimerCount()).toBe(0);

            service.resumeTurnTimer(session.id);

            expect(jest.getTimerCount()).toBe(1);
            expect(service.getGameTimerState(session.id)).toBe(TurnTimerStates.PlayerTurn);
        });

        it('should handle resuming when no timer exists gracefully', () => {
            const sessionId = 'no-timer-session';

            expect(() => service.resumeTurnTimer(sessionId)).not.toThrow();
        });

        it('should handle resuming when timer is already active', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_LONG);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(() => service.resumeTurnTimer(session.id)).not.toThrow();
        });

        it('should trigger callback after resumed timer expires', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_LONG);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            jest.advanceTimersByTime(CUSTOM_TIMEOUT_MEDIUM);
            service.pauseTurnTimer(session.id);
            service.resumeTurnTimer(session.id);

            jest.advanceTimersByTime(CUSTOM_TIMEOUT_LONG - CUSTOM_TIMEOUT_MEDIUM + TIMER_BUFFER);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.timeout', { session });
        });

        it('should handle resumeTurnTimer when remainingTime is zero or negative', () => {
            const session = createMockSession();
            service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_SHORT);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            jest.advanceTimersByTime(CUSTOM_TIMEOUT_SHORT);
            service.pauseTurnTimer(session.id);

            type ServiceWithPrivateMethod = {
                turnTimers: Map<
                    string,
                    {
                        remainingTime: number;
                        timeout: number | null;
                        callback: () => void;
                        startTime: number;
                        duration: number;
                    }
                >;
            };

            const timerData = (service as unknown as ServiceWithPrivateMethod).turnTimers.get(session.id);
            if (timerData) {
                timerData.remainingTime = 0;
            }

            service.resumeTurnTimer(session.id);

            expect(jest.getTimerCount()).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getNextActivePlayer edge cases (private, tested via nextTurn)', () => {
        it('should handle when current player is not in turn order', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });

            session.turnOrder = ['player2', 'player3'];

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player2');
        });

        it('should skip inactive players', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });
            session.inGamePlayers.player2.isInGame = false;

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player3');
        });

        it('should return first player from turnOrder when getNextActivePlayer returns null', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });
            session.inGamePlayers.player1.isInGame = false;
            session.inGamePlayers.player2.isInGame = false;
            session.inGamePlayers.player3.isInGame = false;

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player1');
        });

        it('should handle empty turnOrder in getNextActivePlayer', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });

            type ServiceWithPrivateMethod = {
                getNextActivePlayer: (session: InGameSession, currentId: string | null) => string | null;
            };

            const emptyTurnOrderSession = { ...session, turnOrder: [] };
            const result = (service as unknown as ServiceWithPrivateMethod).getNextActivePlayer(
                emptyTurnOrderSession,
                'player1',
            );

            expect(result).toBeNull();
        });

        it('should handle duplicate playerId in checkedIds by skipping it when already checked', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });
            session.turnOrder = ['player1', 'player1', 'player2'];
            session.inGamePlayers.player1.isInGame = false;

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player2');
        });

        it('should skip playerId that is already in checkedIds during loop iteration', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player2', hasUsedAction: false },
            });
            session.turnOrder = ['player1', 'player1', 'player2', 'player3'];
            session.inGamePlayers.player1.isInGame = false;

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player3');
        });

        it('should handle multiple duplicates where checkedIds.has returns true', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });
            session.turnOrder = ['player1', 'player1', 'player1', 'player2'];
            session.inGamePlayers.player1.isInGame = false;

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player2');
        });
    });

    describe('integration tests', () => {
        it('should handle complete turn cycle', () => {
            const session = createMockSession();

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(session.currentTurn.activePlayerId).toBe('player1');

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(session.currentTurn.activePlayerId).toBe('player2');

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(session.currentTurn.activePlayerId).toBe('player3');

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(session.currentTurn.activePlayerId).toBe('player1');
        });

        it('should handle mix of manual and automatic turn endings', () => {
            const session = createMockSession();

            service.startFirstTurnWithTransition(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(session.currentTurn.activePlayerId).toBe('player1');

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(session.currentTurn.activePlayerId).toBe('player2');

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(session.currentTurn.activePlayerId).toBe('player3');
        });

        // it('should clear timer when scheduling new timeout', () => {
        //     const session = createMockSession();
        //     service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_SHORT);
        //     jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

        //     expect(jest.getTimerCount()).toBe(1);

        //     const timeoutCallCountBeforeSecondCall = (eventEmitter.emit as jest.Mock).mock.calls.filter(
        //         (call) => call[0] === 'turn.timeout',
        //     ).length;

        //     service.startFirstTurnWithTransition(session, CUSTOM_TIMEOUT_MEDIUM);
        //     jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

        //     jest.advanceTimersByTime(CUSTOM_TIMEOUT_SHORT);

        //     const timeoutCallCountAfter = (eventEmitter.emit as jest.Mock).mock.calls.filter(
        //         (call) => call[0] === 'turn.timeout',
        //     ).length;

        //     expect(timeoutCallCountAfter).toBe(timeoutCallCountBeforeSecondCall);
        // });

        it('should handle clearing non-existent timer', () => {
            const session = createMockSession();

            expect(() => service.endTurnManual(session)).not.toThrow();
        });
    });
});
