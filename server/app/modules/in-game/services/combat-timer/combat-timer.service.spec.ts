/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { COMBAT_DURATION } from '@common/constants/in-game';
import { ServerEvents } from '@app/enums/server-events.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { CombatTimerService } from './combat-timer.service';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';

describe('CombatTimerService', () => {
    let service: CombatTimerService;
    let eventEmitter: jest.Mocked<EventEmitter2>;
    let mockSessionRepository: { isVirtualPlayer: jest.Mock };

    const SESSION_ID_1 = 'session-1';
    const SESSION_ID_2 = 'session-2';
    const ATTACKER_ID = 'attacker-1';
    const TARGET_ID = 'target-1';
    const ATTACKER_TILE_EFFECT = 2;
    const TARGET_TILE_EFFECT = 1;

    const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: SESSION_ID_1,
        inGameId: 'in-game-1',
        gameId: 'game-1',
        chatId: 'chat-1',
        maxPlayers: 4,
        mode: GameMode.CLASSIC,
        isGameStarted: true,
        inGamePlayers: {},
        teams: {
            1: { number: 1, playerIds: [] }, // eslint-disable-line @typescript-eslint/naming-convention -- Test data
        },
        currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        turnOrder: [],
        playerCount: 0,
        ...overrides,
    });

    beforeEach(async () => {
        const mockEventEmitter = {
            emit: jest.fn(),
        };

        mockSessionRepository = {
            isVirtualPlayer: jest.fn().mockReturnValue(false),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatTimerService,
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

        service = module.get<CombatTimerService>(CombatTimerService);
        eventEmitter = module.get(EventEmitter2);

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('startCombatTimer', () => {
        it('should add session to activeCombats', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(jest.getTimerCount()).toBeGreaterThan(0);
        });

        it('should emit combat.started event with all parameters', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID, ATTACKER_TILE_EFFECT, TARGET_TILE_EFFECT);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatStarted, {
                sessionId: session.id,
                attackerId: ATTACKER_ID,
                targetId: TARGET_ID,
                attackerTileEffect: ATTACKER_TILE_EFFECT,
                targetTileEffect: TARGET_TILE_EFFECT,
            });
        });

        it('should emit combat.started event without optional tile effects', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatStarted, {
                sessionId: session.id,
                attackerId: ATTACKER_ID,
                targetId: TARGET_ID,
                attackerTileEffect: undefined,
                targetTileEffect: undefined,
            });
        });

        it('should emit combat.timerRestart event', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatTimerRestart, { sessionId: session.id });
        });

        it('should emit VirtualPlayerCombatStarted when attacker is virtual player', () => {
            const session = createMockSession();
            mockSessionRepository.isVirtualPlayer.mockReturnValueOnce(true);

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.VirtualPlayerCombatStarted, {
                sessionId: session.id,
                attackerId: ATTACKER_ID,
                targetId: TARGET_ID,
            });
        });

        it('should schedule combat loop', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(jest.getTimerCount()).toBe(1);
        });

        it('should clear existing timer before scheduling new one', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);
            const timerCountBefore = jest.getTimerCount();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);
            const timerCountAfter = jest.getTimerCount();

            expect(timerCountBefore).toBe(1);
            expect(timerCountAfter).toBe(1);
        });
    });

    describe('stopCombatTimer', () => {
        it('should remove session from activeCombats', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            service.stopCombatTimer(session);

            jest.advanceTimersByTime(COMBAT_DURATION);

            expect(eventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.CombatNewRound, { sessionId: session.id });
        });

        it('should clear and delete timer when timer exists', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(jest.getTimerCount()).toBe(1);

            service.stopCombatTimer(session);

            expect(jest.getTimerCount()).toBe(0);
        });

        it('should handle stopping timer when no timer exists gracefully', () => {
            const session = createMockSession();

            expect(() => service.stopCombatTimer(session)).not.toThrow();
        });

        it('should not emit events after stopping timer', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);
            service.stopCombatTimer(session);

            jest.advanceTimersByTime(COMBAT_DURATION);

            const newRoundCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === ServerEvents.CombatNewRound).length;
            expect(newRoundCallCount).toBe(0);
        });
    });

    describe('forceNextLoop', () => {
        it('should clear existing timer', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(jest.getTimerCount()).toBe(1);

            service.forceNextLoop(session);

            expect(jest.getTimerCount()).toBe(1);
        });

        it('should emit combat.newRound event', () => {
            const session = createMockSession();

            service.forceNextLoop(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatNewRound, { sessionId: session.id });
        });

        it('should emit combat.timerLoop event', () => {
            const session = createMockSession();

            service.forceNextLoop(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatTimerLoop, { sessionId: session.id });
        });

        it('should emit combat.timerRestart event', () => {
            const session = createMockSession();

            service.forceNextLoop(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatTimerRestart, { sessionId: session.id });
        });

        it('should schedule new combat loop', () => {
            const session = createMockSession();

            service.forceNextLoop(session);

            expect(jest.getTimerCount()).toBe(1);
        });

        it('should emit all events in correct order', () => {
            const session = createMockSession();

            service.forceNextLoop(session);

            const emitCalls = (eventEmitter.emit as jest.Mock).mock.calls;
            const newRoundIndex = emitCalls.findIndex((call) => call[0] === ServerEvents.CombatNewRound);
            const timerLoopIndex = emitCalls.findIndex((call) => call[0] === ServerEvents.CombatTimerLoop);
            const timerRestartIndex = emitCalls.findIndex((call) => call[0] === ServerEvents.CombatTimerRestart);

            expect(newRoundIndex).toBeLessThan(timerLoopIndex);
            expect(timerLoopIndex).toBeLessThan(timerRestartIndex);
        });
    });

    describe('scheduleCombatLoop (private, tested via public methods)', () => {
        it('should create timer that triggers after COMBAT_DURATION', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION - 1);

            expect(eventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.CombatNewRound, { sessionId: session.id });

            jest.advanceTimersByTime(1);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatNewRound, { sessionId: session.id });
        });

        it('should emit combat.newRound when timer expires and combat is active', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatNewRound, { sessionId: session.id });
        });

        it('should emit combat.timerLoop when timer expires and combat is active', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatTimerLoop, { sessionId: session.id });
        });

        it('should emit combat.timerRestart when timer expires and combat is active', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatTimerRestart, { sessionId: session.id });
        });

        it('should schedule next loop when timer expires and combat is active', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION);

            expect(jest.getTimerCount()).toBe(1);
        });

        it('should not emit events when timer expires but combat is not active', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            type ServiceWithPrivateMethod = {
                activeCombats: Set<string>;
            };

            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.delete(session.id);

            jest.advanceTimersByTime(COMBAT_DURATION);

            const newRoundCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === ServerEvents.CombatNewRound).length;
            expect(newRoundCallCount).toBe(0);
        });

        it('should create continuous loop while combat is active', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION);
            const firstRoundCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === ServerEvents.CombatNewRound).length;

            jest.advanceTimersByTime(COMBAT_DURATION);
            const secondRoundCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === ServerEvents.CombatNewRound).length;

            expect(firstRoundCallCount).toBe(1);
            expect(secondRoundCallCount).toBe(2);
        });

        it('should stop loop when combat is stopped', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION);
            service.stopCombatTimer(session);

            jest.advanceTimersByTime(COMBAT_DURATION);

            const newRoundCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === ServerEvents.CombatNewRound).length;
            expect(newRoundCallCount).toBe(1);
        });
    });

    describe('clearCombatTimer (private, tested via public methods)', () => {
        it('should clear timer when timer exists', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(jest.getTimerCount()).toBe(1);

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(jest.getTimerCount()).toBe(1);
        });

        it('should handle clearing when no timer exists gracefully', () => {
            const session = createMockSession();

            expect(() => service.forceNextLoop(session)).not.toThrow();
        });

        it('should clear timer in scheduleCombatLoop before creating new one', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            const timerCountBefore = jest.getTimerCount();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);
            const timerCountAfter = jest.getTimerCount();

            expect(timerCountBefore).toBe(1);
            expect(timerCountAfter).toBe(1);
        });

        it('should clear timer in forceNextLoop before scheduling new one', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            const timerCountBefore = jest.getTimerCount();
            service.forceNextLoop(session);
            const timerCountAfter = jest.getTimerCount();

            expect(timerCountBefore).toBe(1);
            expect(timerCountAfter).toBe(1);
        });
    });

    describe('integration tests', () => {
        it('should handle multiple sessions independently', () => {
            const session1 = createMockSession({ id: SESSION_ID_1 });
            const session2 = createMockSession({ id: SESSION_ID_2 });

            service.startCombatTimer(session1, ATTACKER_ID, TARGET_ID);
            service.startCombatTimer(session2, ATTACKER_ID, TARGET_ID);

            expect(jest.getTimerCount()).toBe(2);

            service.stopCombatTimer(session1);

            expect(jest.getTimerCount()).toBe(1);

            jest.advanceTimersByTime(COMBAT_DURATION);

            const newRoundCalls = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === ServerEvents.CombatNewRound);
            expect(newRoundCalls.length).toBe(1);
            expect(newRoundCalls[0][1]).toEqual({ sessionId: SESSION_ID_2 });
        });

        it('should handle start -> stop -> start cycle', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);
            jest.advanceTimersByTime(COMBAT_DURATION / 2);
            service.stopCombatTimer(session);
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatNewRound, { sessionId: session.id });
        });

        it('should handle forceNextLoop during active combat', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION / 2);
            service.forceNextLoop(session);

            const newRoundCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === ServerEvents.CombatNewRound).length;

            expect(newRoundCallCount).toBe(1);
            expect(jest.getTimerCount()).toBe(1);
        });

        it('should reset timer after forceNextLoop', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            jest.advanceTimersByTime(COMBAT_DURATION / 2);
            service.forceNextLoop(session);

            jest.advanceTimersByTime(COMBAT_DURATION / 2);

            const newRoundCallCount = (eventEmitter.emit as jest.Mock).mock.calls.filter((call) => call[0] === ServerEvents.CombatNewRound).length;

            expect(newRoundCallCount).toBe(1);

            jest.advanceTimersByTime(COMBAT_DURATION / 2);

            const newRoundCallCountAfter = (eventEmitter.emit as jest.Mock).mock.calls.filter(
                (call) => call[0] === ServerEvents.CombatNewRound,
            ).length;

            expect(newRoundCallCountAfter).toBe(2);
        });
    });

    describe('edge cases', () => {
        it('should handle starting combat timer multiple times for same session', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(jest.getTimerCount()).toBe(1);
        });

        it('should handle stopping combat timer multiple times', () => {
            const session = createMockSession();
            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            service.stopCombatTimer(session);
            service.stopCombatTimer(session);
            service.stopCombatTimer(session);

            expect(jest.getTimerCount()).toBe(0);
        });

        it('should handle forceNextLoop without active combat', () => {
            const session = createMockSession();

            service.forceNextLoop(session);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatNewRound, { sessionId: session.id });
            expect(jest.getTimerCount()).toBe(1);
        });

        it('should handle session with different IDs', () => {
            const session1 = createMockSession({ id: 'session-a' });
            const session2 = createMockSession({ id: 'session-b' });

            service.startCombatTimer(session1, ATTACKER_ID, TARGET_ID);
            service.startCombatTimer(session2, ATTACKER_ID, TARGET_ID);

            expect(jest.getTimerCount()).toBe(2);

            service.stopCombatTimer(session1);

            expect(jest.getTimerCount()).toBe(1);
        });
    });
});
