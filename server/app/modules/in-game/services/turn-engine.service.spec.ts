/* eslint-disable max-lines */
import { Test, TestingModule } from '@nestjs/testing';
import { TurnEngineService } from './turn-engine.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InGameSession } from '@common/models/session.interface';
import { InGameSessionRepository } from './in-game-session.repository';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';

describe('TurnEngineService', () => {
    let service: TurnEngineService;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    const CUSTOM_TIMEOUT_SHORT = 1000;
    const CUSTOM_TIMEOUT_LONG = 5000;
    const CUSTOM_TIMEOUT_MEDIUM = 2000;
    const MAX_PLAYERS = 4;
    const TURN_NUMBER_THREE = 3;
    const TURN_NUMBER_FOUR = 4;
    const TURN_NUMBER_FIVE = 5;
    const TURN_NUMBER_SIX = 6;
    const EVENT_CALL_ORDER_THIRD = 3;
    const EVENT_CALL_ORDER_FOURTH = 4;
    const BASE_SPEED = 5;
    const BASE_HEALTH = 100;

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
                attack: Dice.D6,
                defense: Dice.D4,
                movementPoints: 0,
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
                attack: Dice.D6,
                defense: Dice.D4,
                movementPoints: 0,
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
                attack: Dice.D6,
                defense: Dice.D4,
                movementPoints: 0,
            },
        },
        currentTurn: { turnNumber: 1, activePlayerId: 'player1' },
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
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TurnEngineService,
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

        service = module.get<TurnEngineService>(TurnEngineService);
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

    describe('startFirstTurn', () => {
        it('should start the first turn with the first player', () => {
            const session = createMockSession();

            const result = service.startFirstTurn(session);

            expect(result.turnNumber).toBe(1);
            expect(result.activePlayerId).toBe('player1');
            expect(session.currentTurn).toEqual(result);
            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.started', { session });
        });

        it('should throw error when turnOrderPlayerId is empty', () => {
            const session = createMockSession({ turnOrder: [] });

            expect(() => service.startFirstTurn(session)).toThrow('TURN_ORDER_NOT_DEFINED');
        });

        it('should throw error when turnOrderPlayerId is undefined', () => {
            const session = createMockSession({ turnOrder: undefined as unknown as string[] });

            expect(() => service.startFirstTurn(session)).toThrow('TURN_ORDER_NOT_DEFINED');
        });

        it('should schedule timeout for automatic turn end', () => {
            const session = createMockSession();

            service.startFirstTurn(session, CUSTOM_TIMEOUT_LONG);

            expect(jest.getTimerCount()).toBe(1);
        });

        it('should trigger autoEndTurn after timeout', () => {
            const session = createMockSession();

            service.startFirstTurn(session, CUSTOM_TIMEOUT_SHORT);

            jest.advanceTimersByTime(CUSTOM_TIMEOUT_SHORT);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.timeout', { session });
            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.ended', { session });
        });

        it('should use default timeout when not provided', () => {
            const session = createMockSession();

            service.startFirstTurn(session);

            expect(jest.getTimerCount()).toBe(1);
        });
    });

    describe('nextTurn', () => {
        it('should advance to the next player in order', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1' },
            });

            const result = service.nextTurn(session);

            expect(result.turnNumber).toBe(2);
            expect(result.activePlayerId).toBe('player2');
            expect(session.currentTurn).toEqual(result);
        });

        it('should wrap around to first player after last player', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: TURN_NUMBER_THREE, activePlayerId: 'player3' },
            });

            const result = service.nextTurn(session);

            expect(result.turnNumber).toBe(TURN_NUMBER_FOUR);
            expect(result.activePlayerId).toBe('player1');
        });

        it('should emit turn.ended event', () => {
            const session = createMockSession();

            service.nextTurn(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.ended', { session });
        });

        it('should emit turn.transition and turn.started after transition delay', () => {
            const session = createMockSession();

            service.nextTurn(session);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.transition', { session });
            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.started', { session });
        });

        it('should schedule new timeout after transition', () => {
            const session = createMockSession();

            service.nextTurn(session, CUSTOM_TIMEOUT_LONG);

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);

            expect(jest.getTimerCount()).toBe(1);
        });

        it('should clear previous timer', () => {
            const session = createMockSession();
            service.startFirstTurn(session);

            const timerCountBefore = jest.getTimerCount();
            service.nextTurn(session);
            const timerCountAfter = jest.getTimerCount();

            expect(timerCountBefore).toBe(1);
            expect(timerCountAfter).toBe(1);
        });

        it('should handle player not in order by returning first player', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'unknown-player' },
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
                attack: Dice.D6,
                defense: Dice.D4,
                movementPoints: 0,
            };

            const result = service.nextTurn(session);

            expect(result.activePlayerId).toBe('player1');
        });
    });

    describe('endTurnManual', () => {
        it('should end turn manually and advance to next player', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1' },
            });

            const result = service.endTurnManual(session);

            expect(result.turnNumber).toBe(2);
            expect(result.activePlayerId).toBe('player2');
            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.manualEnd', { session });
        });

        it('should clear existing timer', () => {
            const session = createMockSession();
            service.startFirstTurn(session);

            service.endTurnManual(session);

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            const timeoutCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === 'turn.timeout').length;
            expect(timeoutCallCount).toBe(0);
        });

        it('should call nextTurn internally', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 2, activePlayerId: 'player2' },
            });

            service.endTurnManual(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.ended', { session });
        });
    });

    describe('forceEndTurn', () => {
        it('should force end turn and advance to next player', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1' },
            });

            service.forceEndTurn(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.forcedEnd', { session });
            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.ended', { session });
        });

        it('should clear timer when forcing end turn', () => {
            const session = createMockSession();
            service.startFirstTurn(session);

            service.forceEndTurn(session);

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            const timeoutCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === 'turn.timeout').length;
            expect(timeoutCallCount).toBe(0);
        });

        it('should advance turn number', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: TURN_NUMBER_FIVE, activePlayerId: 'player3' },
            });

            service.forceEndTurn(session);

            expect(session.currentTurn.turnNumber).toBe(TURN_NUMBER_SIX);
        });
    });

    describe('forceStopTimer', () => {
        it('should stop timer for a session', () => {
            const session = createMockSession();
            service.startFirstTurn(session);

            expect(jest.getTimerCount()).toBe(1);

            service.forceStopTimer(session.id);

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            const timeoutCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === 'turn.timeout').length;
            expect(timeoutCallCount).toBe(0);
        });

        it('should handle stopping timer for non-existent session gracefully', () => {
            expect(() => service.forceStopTimer('non-existent-session')).not.toThrow();
        });

        it('should clear timer from timers map', () => {
            const session = createMockSession();
            service.startFirstTurn(session);

            service.forceStopTimer(session.id);

            const timerCount = jest.getTimerCount();
            expect(timerCount).toBe(0);
        });
    });

    describe('autoEndTurn (private, tested via timeout)', () => {
        it('should emit turn.timeout event when turn times out', () => {
            const session = createMockSession();
            service.startFirstTurn(session);

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith('turn.timeout', { session });
        });

        it('should advance to next turn after timeout', () => {
            const session = createMockSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1' },
            });
            service.startFirstTurn(session);

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);

            expect(session.currentTurn.activePlayerId).toBe('player2');
            expect(session.currentTurn.turnNumber).toBe(2);
        });
    });

    describe('clearTimer (private, tested via multiple operations)', () => {
        it('should clear timer when scheduling new timeout', () => {
            const session = createMockSession();
            service.startFirstTurn(session, CUSTOM_TIMEOUT_SHORT);
            service.startFirstTurn(session, CUSTOM_TIMEOUT_MEDIUM);

            jest.advanceTimersByTime(CUSTOM_TIMEOUT_SHORT);

            const timeoutCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === 'turn.timeout').length;
            expect(timeoutCallCount).toBe(0);
        });

        it('should handle clearing non-existent timer', () => {
            const session = createMockSession();

            expect(() => service.nextTurn(session)).not.toThrow();
        });
    });

    describe('integration tests', () => {
        it('should handle complete turn cycle', () => {
            const session = createMockSession();

            service.startFirstTurn(session);
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

            service.startFirstTurn(session);
            expect(session.currentTurn.activePlayerId).toBe('player1');

            service.endTurnManual(session);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(session.currentTurn.activePlayerId).toBe('player2');

            jest.advanceTimersByTime(DEFAULT_TURN_DURATION);
            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(session.currentTurn.activePlayerId).toBe('player3');
        });

        it('should emit all expected events in correct order', () => {
            const session = createMockSession();

            service.startFirstTurn(session);
            expect(eventEmitter.emit).toHaveBeenNthCalledWith(1, 'turn.started', { session });

            service.nextTurn(session);
            expect(eventEmitter.emit).toHaveBeenNthCalledWith(2, 'turn.ended', { session });

            jest.advanceTimersByTime(DEFAULT_TURN_TRANSITION_DURATION);
            expect(eventEmitter.emit).toHaveBeenNthCalledWith(EVENT_CALL_ORDER_THIRD, 'turn.transition', { session });
            expect(eventEmitter.emit).toHaveBeenNthCalledWith(EVENT_CALL_ORDER_FOURTH, 'turn.started', { session });
        });
    });
});

