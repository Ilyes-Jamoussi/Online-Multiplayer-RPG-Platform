import { Test, TestingModule } from '@nestjs/testing';
import { VirtualPlayerService } from './virtual-player.service';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { VPExecutionService } from '@app/modules/in-game/services/vp-execution/vp-execution.service';
import {
    VIRTUAL_PLAYER_ACTION_DELAY_MS,
    VIRTUAL_PLAYER_THINKING_DELAY_MAX_MS,
    VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS,
} from '@app/constants/virtual-player.constants';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { TurnState } from '@common/interfaces/turn-state.interface';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

describe('VirtualPlayerService', () => {
    let service: VirtualPlayerService;
    let gameplayService: jest.Mocked<GameplayService>;
    let sessionRepository: jest.Mocked<InGameSessionRepository>;
    let vpExecutionService: jest.Mocked<VPExecutionService>;

    const SESSION_ID = 'session-123';
    const ATTACKER_ID = 'attacker-1';
    const TARGET_ID = 'target-1';
    const PLAYER_ID = 'player-1';
    const WINNER_ID = 'winner-1';
    const TURN_NUMBER = 1;
    const ZERO = 0;
    const ONE = 1;
    const FOUR = 4;

    const createMockTurnState = (overrides: Partial<TurnState> = {}): TurnState => ({
        turnNumber: TURN_NUMBER,
        activePlayerId: ATTACKER_ID,
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
        const mockGameplayService = {
            handleVPCombat: jest.fn(),
        };

        const mockSessionRepository = {
            isVirtualPlayer: jest.fn(),
            findById: jest.fn(),
        };

        const mockVPExecutionService = {
            continueOrEndTurn: jest.fn(),
            executeVPTurn: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VirtualPlayerService,
                {
                    provide: GameplayService,
                    useValue: mockGameplayService,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockSessionRepository,
                },
                {
                    provide: VPExecutionService,
                    useValue: mockVPExecutionService,
                },
            ],
        }).compile();

        service = module.get<VirtualPlayerService>(VirtualPlayerService);
        gameplayService = module.get(GameplayService);
        sessionRepository = module.get(InGameSessionRepository);
        vpExecutionService = module.get(VPExecutionService);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('handleCombatStarted', () => {
        it('should delegate to gameplayService.handleVPCombat with sessionId, attackerId and targetId', () => {
            const payload = { sessionId: SESSION_ID, attackerId: ATTACKER_ID, targetId: TARGET_ID };

            service.handleCombatStarted(payload);

            expect(gameplayService.handleVPCombat).toHaveBeenCalledWith(SESSION_ID, ATTACKER_ID, TARGET_ID);
        });
    });

    describe('handleCombatTimerRestart', () => {
        it('should delegate to gameplayService.handleVPCombat with sessionId only', () => {
            const payload = { sessionId: SESSION_ID };

            service.handleCombatTimerRestart(payload);

            expect(gameplayService.handleVPCombat).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('handleCombatVictory', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should return early when attacker is not virtual player', () => {
            const payload = { sessionId: SESSION_ID, winnerId: WINNER_ID, attackerId: ATTACKER_ID };
            sessionRepository.isVirtualPlayer.mockReturnValue(false);

            service.handleCombatVictory(payload);

            expect(sessionRepository.findById).not.toHaveBeenCalled();
            expect(vpExecutionService.continueOrEndTurn).not.toHaveBeenCalled();
        });

        it('should return early when session is not found', () => {
            const payload = { sessionId: SESSION_ID, winnerId: WINNER_ID, attackerId: ATTACKER_ID };
            sessionRepository.isVirtualPlayer.mockReturnValue(true);
            sessionRepository.findById.mockReturnValue(null);

            service.handleCombatVictory(payload);

            expect(vpExecutionService.continueOrEndTurn).not.toHaveBeenCalled();
        });

        it('should return early when attacker is not current turn active player', () => {
            const payload = { sessionId: SESSION_ID, winnerId: WINNER_ID, attackerId: ATTACKER_ID };
            const session = createMockSession({
                currentTurn: createMockTurnState({ activePlayerId: 'different-player' }),
            });
            sessionRepository.isVirtualPlayer.mockReturnValue(true);
            sessionRepository.findById.mockReturnValue(session);

            service.handleCombatVictory(payload);

            expect(vpExecutionService.continueOrEndTurn).not.toHaveBeenCalled();
        });

        it('should continue turn when winnerId is null', () => {
            const payload = { sessionId: SESSION_ID, winnerId: null, attackerId: ATTACKER_ID };
            const session = createMockSession();
            sessionRepository.isVirtualPlayer.mockReturnValue(true);
            sessionRepository.findById.mockReturnValue(session);

            service.handleCombatVictory(payload);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);

            expect(vpExecutionService.continueOrEndTurn).toHaveBeenCalledWith(SESSION_ID, ATTACKER_ID);
        });

        it('should continue turn when winnerId equals attackerId', () => {
            const payload = { sessionId: SESSION_ID, winnerId: ATTACKER_ID, attackerId: ATTACKER_ID };
            const session = createMockSession();
            sessionRepository.isVirtualPlayer.mockReturnValue(true);
            sessionRepository.findById.mockReturnValue(session);

            service.handleCombatVictory(payload);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);

            expect(vpExecutionService.continueOrEndTurn).toHaveBeenCalledWith(SESSION_ID, ATTACKER_ID);
        });

        it('should not continue turn when winnerId is different from attackerId', () => {
            const payload = { sessionId: SESSION_ID, winnerId: WINNER_ID, attackerId: ATTACKER_ID };
            const session = createMockSession();
            sessionRepository.isVirtualPlayer.mockReturnValue(true);
            sessionRepository.findById.mockReturnValue(session);

            service.handleCombatVictory(payload);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_ACTION_DELAY_MS);

            expect(vpExecutionService.continueOrEndTurn).not.toHaveBeenCalled();
        });
    });

    describe('handleVirtualPlayerTurn', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.spyOn(Math, 'random').mockReturnValue(ZERO);
        });

        afterEach(() => {
            jest.spyOn(Math, 'random').mockRestore();
        });

        it('should simulate thinking time and execute VP turn', async () => {
            const payload = { sessionId: SESSION_ID, playerId: PLAYER_ID, playerType: VirtualPlayerType.Offensive };

            const promise = service.handleVirtualPlayerTurn(payload);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS);

            await promise;

            expect(vpExecutionService.executeVPTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, VirtualPlayerType.Offensive);
        });

        it('should execute VP turn with defensive player type', async () => {
            const payload = { sessionId: SESSION_ID, playerId: PLAYER_ID, playerType: VirtualPlayerType.Defensive };

            const promise = service.handleVirtualPlayerTurn(payload);

            jest.advanceTimersByTime(VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS);

            await promise;

            expect(vpExecutionService.executeVPTurn).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, VirtualPlayerType.Defensive);
        });
    });

    describe('simulateThinkingTime', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('should resolve after minimum delay when random returns 0', async () => {
            jest.spyOn(Math, 'random').mockReturnValue(ZERO);

            const promise = service['simulateThinkingTime']();

            jest.advanceTimersByTime(VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS);

            await promise;

            jest.spyOn(Math, 'random').mockRestore();
        });

        it('should resolve after maximum delay when random returns 1', async () => {
            jest.spyOn(Math, 'random').mockReturnValue(ONE);

            const promise = service['simulateThinkingTime']();

            const expectedMaxDelay =
                Math.floor(ONE * (VIRTUAL_PLAYER_THINKING_DELAY_MAX_MS - VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS + ONE)) +
                VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS;
            jest.advanceTimersByTime(expectedMaxDelay);

            await promise;

            jest.spyOn(Math, 'random').mockRestore();
        });

        it('should resolve after delay within min and max range', async () => {
            const randomValue = 0.5;
            const expectedDelay =
                Math.floor(randomValue * (VIRTUAL_PLAYER_THINKING_DELAY_MAX_MS - VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS + ONE)) +
                VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS;
            jest.spyOn(Math, 'random').mockReturnValue(randomValue);

            const promise = service['simulateThinkingTime']();

            jest.advanceTimersByTime(expectedDelay);

            await promise;

            jest.spyOn(Math, 'random').mockRestore();
        });
    });
});
