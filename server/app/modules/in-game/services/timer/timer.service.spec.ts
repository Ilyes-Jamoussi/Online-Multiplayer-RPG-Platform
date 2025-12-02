import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { CombatTimerService } from '@app/modules/in-game/services/combat-timer/combat-timer.service';
import { TurnTimerService } from '@app/modules/in-game/services/turn-timer/turn-timer.service';
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { TurnState } from '@common/interfaces/turn-state.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { TimerService } from './timer.service';

describe('TimerService', () => {
    let service: TimerService;
    let turnTimerService: jest.Mocked<TurnTimerService>;
    let combatTimerService: jest.Mocked<CombatTimerService>;

    const SESSION_ID = 'session-123';
    const ATTACKER_ID = 'attacker-1';
    const TARGET_ID = 'target-1';
    const ACTIVE_PLAYER_ID = 'active-player-1';
    const ATTACKER_TILE_EFFECT = 2;
    const TARGET_TILE_EFFECT = 1;
    const TIMEOUT_MS = 5000;
    const TURN_NUMBER = 5;
    const ZERO = 0;
    const ONE = 1;
    const FOUR = 4;

    const createMockTurnState = (overrides: Partial<TurnState> = {}): TurnState => ({
        turnNumber: TURN_NUMBER,
        activePlayerId: ACTIVE_PLAYER_ID,
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
        inGamePlayers: {},
        teams: {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- Team number must be numeric
            1: { number: ONE, playerIds: [] },
        },
        currentTurn: createMockTurnState(),
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        turnOrder: [],
        playerCount: ZERO,
        ...overrides,
    });

    beforeEach(async () => {
        const mockTurnTimerService = {
            startFirstTurnWithTransition: jest.fn(),
            endTurnManual: jest.fn(),
            getGameTimerState: jest.fn(),
            forceStopTimer: jest.fn(),
            clearTimerForSession: jest.fn(),
            pauseTurnTimer: jest.fn(),
            resumeTurnTimer: jest.fn(),
        };

        const mockCombatTimerService = {
            startCombatTimer: jest.fn(),
            stopCombatTimer: jest.fn(),
            forceNextLoop: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TimerService,
                {
                    provide: TurnTimerService,
                    useValue: mockTurnTimerService,
                },
                {
                    provide: CombatTimerService,
                    useValue: mockCombatTimerService,
                },
            ],
        }).compile();

        service = module.get<TimerService>(TimerService);
        turnTimerService = module.get(TurnTimerService);
        combatTimerService = module.get(CombatTimerService);
    });

    describe('startFirstTurnWithTransition', () => {
        it('should delegate to turnTimerService.startFirstTurnWithTransition with session and default timeout', () => {
            const session = createMockSession();
            const expectedTurnState = createMockTurnState();
            turnTimerService.startFirstTurnWithTransition.mockReturnValue(expectedTurnState);

            const result = service.startFirstTurnWithTransition(session);

            expect(turnTimerService.startFirstTurnWithTransition).toHaveBeenCalledWith(session, DEFAULT_TURN_DURATION);
            expect(result).toBe(expectedTurnState);
        });

        it('should delegate to turnTimerService.startFirstTurnWithTransition with custom timeout', () => {
            const session = createMockSession();
            const expectedTurnState = createMockTurnState();
            turnTimerService.startFirstTurnWithTransition.mockReturnValue(expectedTurnState);

            const result = service.startFirstTurnWithTransition(session, TIMEOUT_MS);

            expect(turnTimerService.startFirstTurnWithTransition).toHaveBeenCalledWith(session, TIMEOUT_MS);
            expect(result).toBe(expectedTurnState);
        });
    });

    describe('endTurnManual', () => {
        it('should delegate to turnTimerService.endTurnManual', () => {
            const session = createMockSession();

            service.endTurnManual(session);

            expect(turnTimerService.endTurnManual).toHaveBeenCalledWith(session);
        });
    });

    describe('getGameTimerState', () => {
        it('should delegate to turnTimerService.getGameTimerState', () => {
            const expectedState = TurnTimerStates.PlayerTurn;
            turnTimerService.getGameTimerState.mockReturnValue(expectedState);

            const result = service.getGameTimerState(SESSION_ID);

            expect(turnTimerService.getGameTimerState).toHaveBeenCalledWith(SESSION_ID);
            expect(result).toBe(expectedState);
        });
    });

    describe('forceStopTimer', () => {
        it('should delegate to turnTimerService.forceStopTimer', () => {
            service.forceStopTimer(SESSION_ID);

            expect(turnTimerService.forceStopTimer).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('clearTimerForSession', () => {
        it('should delegate to turnTimerService.clearTimerForSession and combatTimerService.stopCombatTimer', () => {
            const mockSession = { id: SESSION_ID } as InGameSession;

            service.clearTimerForSession(SESSION_ID);

            expect(turnTimerService.clearTimerForSession).toHaveBeenCalledWith(SESSION_ID);
            expect(combatTimerService.stopCombatTimer).toHaveBeenCalledWith(mockSession);
        });
    });

    describe('startCombatTimer', () => {
        it('should delegate to combatTimerService.startCombatTimer with session, attackerId and targetId', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID);

            expect(combatTimerService.startCombatTimer).toHaveBeenCalledWith(session, ATTACKER_ID, TARGET_ID, undefined, undefined);
        });

        it('should delegate to combatTimerService.startCombatTimer with tile effects', () => {
            const session = createMockSession();

            service.startCombatTimer(session, ATTACKER_ID, TARGET_ID, ATTACKER_TILE_EFFECT, TARGET_TILE_EFFECT);

            expect(combatTimerService.startCombatTimer).toHaveBeenCalledWith(
                session,
                ATTACKER_ID,
                TARGET_ID,
                ATTACKER_TILE_EFFECT,
                TARGET_TILE_EFFECT,
            );
        });
    });

    describe('stopCombatTimer', () => {
        it('should delegate to combatTimerService.stopCombatTimer', () => {
            const session = createMockSession();

            service.stopCombatTimer(session);

            expect(combatTimerService.stopCombatTimer).toHaveBeenCalledWith(session);
        });
    });

    describe('forceNextLoop', () => {
        it('should delegate to combatTimerService.forceNextLoop', () => {
            const session = createMockSession();

            service.forceNextLoop(session);

            expect(combatTimerService.forceNextLoop).toHaveBeenCalledWith(session);
        });
    });

    describe('startCombat', () => {
        it('should pause turn timer and start combat timer', () => {
            const session = createMockSession();

            service.startCombat(session, ATTACKER_ID, TARGET_ID);

            expect(turnTimerService.pauseTurnTimer).toHaveBeenCalledWith(SESSION_ID);
            expect(combatTimerService.startCombatTimer).toHaveBeenCalledWith(session, ATTACKER_ID, TARGET_ID, undefined, undefined);
        });

        it('should pause turn timer and start combat timer with tile effects', () => {
            const session = createMockSession();

            service.startCombat(session, ATTACKER_ID, TARGET_ID, ATTACKER_TILE_EFFECT, TARGET_TILE_EFFECT);

            expect(turnTimerService.pauseTurnTimer).toHaveBeenCalledWith(SESSION_ID);
            expect(combatTimerService.startCombatTimer).toHaveBeenCalledWith(
                session,
                ATTACKER_ID,
                TARGET_ID,
                ATTACKER_TILE_EFFECT,
                TARGET_TILE_EFFECT,
            );
        });
    });

    describe('endCombat', () => {
        it('should stop combat timer and end turn manually when winnerId is null', () => {
            const session = createMockSession();

            service.endCombat(session, null);

            expect(combatTimerService.stopCombatTimer).toHaveBeenCalledWith(session);
            expect(turnTimerService.endTurnManual).toHaveBeenCalledWith(session);
            expect(turnTimerService.resumeTurnTimer).not.toHaveBeenCalled();
        });

        it('should stop combat timer and end turn manually when winnerId is not active player', () => {
            const session = createMockSession();
            const winnerId = 'different-player';

            service.endCombat(session, winnerId);

            expect(combatTimerService.stopCombatTimer).toHaveBeenCalledWith(session);
            expect(turnTimerService.endTurnManual).toHaveBeenCalledWith(session);
            expect(turnTimerService.resumeTurnTimer).not.toHaveBeenCalled();
        });

        it('should stop combat timer and resume turn timer when winnerId is active player', () => {
            const session = createMockSession();

            service.endCombat(session, ACTIVE_PLAYER_ID);

            expect(combatTimerService.stopCombatTimer).toHaveBeenCalledWith(session);
            expect(turnTimerService.resumeTurnTimer).toHaveBeenCalledWith(SESSION_ID);
            expect(turnTimerService.endTurnManual).not.toHaveBeenCalled();
        });
    });
});

