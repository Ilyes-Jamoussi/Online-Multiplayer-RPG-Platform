/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { DiceSides } from '@app/enums/dice-sides.enum';
import { ServerEvents } from '@app/enums/server-events.enum';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { MovementService } from '@app/modules/in-game/services/movement/movement.service';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { TrackingService } from '@app/modules/in-game/services/tracking/tracking.service';
import { Avatar } from '@common/enums/avatar.enum';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { TileCombatEffect, TileKind } from '@common/enums/tile.enum';
import { CombatState } from '@common/interfaces/combat.interface';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { CombatService } from './combat.service';

const MOCK_SESSION_ID = 'session-123';
const MOCK_PLAYER_ID_1 = 'player-1';
const MOCK_PLAYER_ID_2 = 'player-2';
const MOCK_PLAYER_NAME_1 = 'Player 1';
const MOCK_PLAYER_NAME_2 = 'Player 2';
const MOCK_X = 5;
const MOCK_Y = 10;
const MOCK_X_2 = 6;
const MOCK_Y_2 = 11;
const MOCK_BASE_ATTACK = 10;
const MOCK_BASE_DEFENSE = 5;
const MOCK_POSTURE_BONUS = 2;
const MOCK_HEALTH = 100;
const MOCK_COMBAT_WINS = 3;
const MOCK_RANDOM_VALUE = 0.5;

const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: MOCK_PLAYER_ID_1,
    name: MOCK_PLAYER_NAME_1,
    avatar: Avatar.Avatar1,
    isAdmin: false,
    baseHealth: MOCK_HEALTH,
    healthBonus: 0,
    health: MOCK_HEALTH,
    maxHealth: MOCK_HEALTH,
    baseSpeed: 3,
    speedBonus: 0,
    speed: 3,
    boatSpeedBonus: 0,
    boatSpeed: 0,
    baseAttack: MOCK_BASE_ATTACK,
    attackBonus: 0,
    baseDefense: MOCK_BASE_DEFENSE,
    defenseBonus: 0,
    attackDice: Dice.D6,
    defenseDice: Dice.D4,
    x: MOCK_X,
    y: MOCK_Y,
    isInGame: true,
    startPointId: '',
    actionsRemaining: 1,
    combatCount: 0,
    combatWins: 0,
    combatLosses: 0,
    combatDraws: 0,
    hasCombatBonus: false,
    ...overrides,
});

const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
    id: MOCK_SESSION_ID,
    inGameId: 'in-game-123',
    gameId: 'game-123',
    chatId: 'chat-123',
    maxPlayers: 4,
    mode: GameMode.CLASSIC,
    isGameStarted: false,
    isAdminModeActive: false,
    inGamePlayers: {
        [MOCK_PLAYER_ID_1]: createMockPlayer({ id: MOCK_PLAYER_ID_1, name: MOCK_PLAYER_NAME_1 }),
        [MOCK_PLAYER_ID_2]: createMockPlayer({ id: MOCK_PLAYER_ID_2, name: MOCK_PLAYER_NAME_2 }),
    },
    teams: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Team number must be numeric
        1: { number: 1, playerIds: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2] },
    },
    currentTurn: { turnNumber: 1, activePlayerId: MOCK_PLAYER_ID_1, hasUsedAction: false },
    startPoints: [],
    mapSize: MapSize.MEDIUM,
    turnOrder: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2],
    playerCount: 2,
    ...overrides,
});

const createMockTileWithPlayerId = (overrides: Partial<Tile & { playerId: string | null }> = {}): Tile & { playerId: string | null } => ({
    kind: TileKind.BASE,
    x: MOCK_X,
    y: MOCK_Y,
    playerId: null,
    ...overrides,
});

describe('CombatService', () => {
    let service: CombatService;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;
    let mockTimerService: jest.Mocked<TimerService>;
    let mockRepository: jest.Mocked<InGameSessionRepository>;
    let mockMovementService: jest.Mocked<MovementService>;
    let mockGameCacheService: jest.Mocked<GameCacheService>;

    beforeEach(async () => {
        const mockEventEmitterValue = {
            emit: jest.fn(),
        };

        const mockTimerServiceValue = {
            startCombat: jest.fn(),
            endCombat: jest.fn(),
            forceNextLoop: jest.fn(),
            clearTimerForSession: jest.fn(),
        };

        const mockRepositoryValue = {
            findById: jest.fn(),
            incrementPlayerCombatCount: jest.fn(),
            incrementPlayerCombatWins: jest.fn(),
            incrementPlayerCombatLosses: jest.fn(),
            incrementPlayerCombatDraws: jest.fn(),
            decreasePlayerHealth: jest.fn(),
            resetPlayerHealth: jest.fn(),
            playerHasFlag: jest.fn(),
            dropFlag: jest.fn(),
            isVirtualPlayer: jest.fn(),
        };

        const mockMovementServiceValue = {
            calculateReachableTiles: jest.fn(),
            movePlayerToStartPosition: jest.fn(),
        };

        const mockGameCacheServiceValue = {
            getTileByPlayerId: jest.fn(),
        };

        const mockTrackingServiceValue = {
            trackDamageReceived: jest.fn(),
            trackDamageDealt: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatService,
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitterValue,
                },
                {
                    provide: TimerService,
                    useValue: mockTimerServiceValue,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockRepositoryValue,
                },
                {
                    provide: MovementService,
                    useValue: mockMovementServiceValue,
                },
                {
                    provide: GameCacheService,
                    useValue: mockGameCacheServiceValue,
                },
                {
                    provide: TrackingService,
                    useValue: mockTrackingServiceValue,
                },
            ],
        }).compile();

        service = module.get<CombatService>(CombatService);
        mockEventEmitter = module.get(EventEmitter2);
        mockTimerService = module.get(TimerService);
        mockRepository = module.get(InGameSessionRepository);
        mockMovementService = module.get(MovementService);
        mockGameCacheService = module.get(GameCacheService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('combatAbandon', () => {
        it('should abandon combat successfully when playerA abandons', () => {
            const session = createMockSession();
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: null,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(session);

            service.combatAbandon(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockRepository.incrementPlayerCombatWins).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_2);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.CombatVictory,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    playerAId: MOCK_PLAYER_ID_1,
                    playerBId: MOCK_PLAYER_ID_2,
                    winnerId: MOCK_PLAYER_ID_2,
                    abandon: true,
                }),
            );
        });

        it('should abandon combat successfully when playerB abandons', () => {
            const session = createMockSession();
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: null,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(session);

            service.combatAbandon(MOCK_SESSION_ID, MOCK_PLAYER_ID_2);

            expect(mockRepository.incrementPlayerCombatWins).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
        });

        it('should throw NotFoundException when combat not found', () => {
            expect(() => service.combatAbandon(MOCK_SESSION_ID, MOCK_PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when player not in combat', () => {
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: null,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);

            expect(() => service.combatAbandon(MOCK_SESSION_ID, 'non-existent')).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when session not found', () => {
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: null,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(null);

            expect(() => service.combatAbandon(MOCK_SESSION_ID, MOCK_PLAYER_ID_1)).toThrow(NotFoundException);
        });
    });

    describe('getSession', () => {
        it('should return session when found', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const result = service.getSession(MOCK_SESSION_ID);

            expect(result).toBe(session);
        });

        it('should return null when session not found', () => {
            mockRepository.findById.mockImplementation(() => {
                throw new Error('Not found');
            });

            const result = service.getSession(MOCK_SESSION_ID);

            expect(result).toBeNull();
        });
    });

    describe('attackPlayerAction', () => {
        it('should start combat successfully', () => {
            const session = createMockSession();
            const targetPosition: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, x: MOCK_X_2, y: MOCK_Y_2 });
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player2;
            mockRepository.findById.mockReturnValue(session);
            mockGameCacheService.getTileByPlayerId.mockReturnValue(createMockTileWithPlayerId());

            service.attackPlayerAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, targetPosition);

            expect(session.inGamePlayers[MOCK_PLAYER_ID_1].actionsRemaining).toBe(0);
            expect(session.currentTurn.hasUsedAction).toBe(true);
            expect(mockTimerService.startCombat).toHaveBeenCalled();
            expect(mockRepository.incrementPlayerCombatCount).toHaveBeenCalledTimes(2);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            const targetPosition: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.attackPlayerAction(MOCK_SESSION_ID, 'non-existent', targetPosition)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const targetPosition: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.attackPlayerAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, targetPosition)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when no opponent at position', () => {
            const session = createMockSession();
            const targetPosition: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.attackPlayerAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, targetPosition)).toThrow(BadRequestException);
        });
    });

    describe('combatChoice', () => {
        it('should set posture for playerA', () => {
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: null,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);

            service.combatChoice(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.OFFENSIVE);

            expect(combatState.playerAPosture).toBe(CombatPosture.OFFENSIVE);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.CombatPostureSelected,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    playerId: MOCK_PLAYER_ID_1,
                    posture: CombatPosture.OFFENSIVE,
                }),
            );
        });

        it('should set posture for playerB', () => {
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: null,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);

            service.combatChoice(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, CombatPosture.DEFENSIVE);

            expect(combatState.playerBPosture).toBe(CombatPosture.DEFENSIVE);
        });

        it('should call forceNextLoop when both postures are set', () => {
            const session = createMockSession();
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: CombatPosture.OFFENSIVE,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(session);

            service.combatChoice(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, CombatPosture.DEFENSIVE);

            expect(mockTimerService.forceNextLoop).toHaveBeenCalledWith(session);
        });

        it('should return early when combat not found', () => {
            service.combatChoice(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.OFFENSIVE);

            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when player not in combat', () => {
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: null,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);

            expect(() => service.combatChoice(MOCK_SESSION_ID, 'non-existent', CombatPosture.OFFENSIVE)).toThrow(BadRequestException);
        });
    });

    describe('handleTimerLoop', () => {
        it('should call combatRound when combat exists', () => {
            const session = createMockSession();
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: CombatPosture.OFFENSIVE,
                playerBPosture: CombatPosture.DEFENSIVE,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(session);
            mockRepository.decreasePlayerHealth.mockReturnValue(MOCK_HEALTH);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            service['handleTimerLoop']({ sessionId: MOCK_SESSION_ID });

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerHealthChanged, expect.anything());
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatResult, expect.anything());

            Math.random = originalRandom;
        });

        it('should return early when combat not found', () => {
            service['handleTimerLoop']({ sessionId: MOCK_SESSION_ID });

            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });
    });

    describe('clearActiveCombatForSession', () => {
        it('should clear active combat', () => {
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: null,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);

            service.clearActiveCombatForSession(MOCK_SESSION_ID);

            const activeCombat = service.getActiveCombat(MOCK_SESSION_ID);
            expect(activeCombat).toBeNull();
        });
    });

    describe('getActiveCombat', () => {
        it('should return active combat when exists', () => {
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: null,
                playerBPosture: null,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);

            const result = service.getActiveCombat(MOCK_SESSION_ID);

            expect(result).toEqual({ playerAId: MOCK_PLAYER_ID_1, playerBId: MOCK_PLAYER_ID_2 });
        });

        it('should return null when combat not found', () => {
            const result = service.getActiveCombat(MOCK_SESSION_ID);

            expect(result).toBeNull();
        });
    });

    describe('combatRound', () => {
        it('should handle combat round with no deaths', () => {
            const session = createMockSession();
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: CombatPosture.OFFENSIVE,
                playerBPosture: CombatPosture.DEFENSIVE,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(session);
            mockRepository.decreasePlayerHealth.mockReturnValue(MOCK_HEALTH);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            service['combatRound'](MOCK_SESSION_ID);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerHealthChanged, expect.anything());
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatResult, expect.anything());

            Math.random = originalRandom;
        });

        it('should handle playerA death', () => {
            const session = createMockSession();
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: CombatPosture.OFFENSIVE,
                playerBPosture: CombatPosture.DEFENSIVE,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(session);
            mockRepository.decreasePlayerHealth.mockReturnValueOnce(0).mockReturnValueOnce(MOCK_HEALTH);
            mockRepository.playerHasFlag.mockReturnValue(false);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            service['combatRound'](MOCK_SESSION_ID);

            expect(mockMovementService.movePlayerToStartPosition).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1);
            expect(mockRepository.resetPlayerHealth).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
            expect(mockRepository.incrementPlayerCombatWins).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_2);
            expect(mockRepository.incrementPlayerCombatLosses).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            Math.random = originalRandom;
        });

        it('should handle playerB death', () => {
            const session = createMockSession();
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: CombatPosture.OFFENSIVE,
                playerBPosture: CombatPosture.DEFENSIVE,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(session);
            mockRepository.decreasePlayerHealth.mockReturnValueOnce(MOCK_HEALTH).mockReturnValueOnce(0);
            mockRepository.playerHasFlag.mockReturnValue(false);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            service['combatRound'](MOCK_SESSION_ID);

            expect(mockMovementService.movePlayerToStartPosition).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_2);
            expect(mockRepository.incrementPlayerCombatWins).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            Math.random = originalRandom;
        });

        it('should handle draw when both players die', () => {
            const session = createMockSession();
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: CombatPosture.OFFENSIVE,
                playerBPosture: CombatPosture.DEFENSIVE,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(session);
            mockRepository.decreasePlayerHealth.mockReturnValue(0);
            mockRepository.playerHasFlag.mockReturnValue(false);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            service['combatRound'](MOCK_SESSION_ID);

            expect(mockRepository.incrementPlayerCombatDraws).toHaveBeenCalledTimes(2);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.CombatVictory,
                expect.objectContaining({
                    winnerId: null,
                }),
            );

            Math.random = originalRandom;
        });

        it('should drop flag when player dies with flag', () => {
            const session = createMockSession();
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: CombatPosture.OFFENSIVE,
                playerBPosture: CombatPosture.DEFENSIVE,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(session);
            mockRepository.decreasePlayerHealth.mockReturnValueOnce(0).mockReturnValueOnce(MOCK_HEALTH);
            mockRepository.playerHasFlag.mockReturnValue(true);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            service['combatRound'](MOCK_SESSION_ID);

            expect(mockRepository.dropFlag).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            Math.random = originalRandom;
        });

        it('should return early when combat not found', () => {
            service['combatRound'](MOCK_SESSION_ID);

            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should return early when session not found', () => {
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: CombatPosture.OFFENSIVE,
                playerBPosture: CombatPosture.DEFENSIVE,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);
            mockRepository.findById.mockReturnValue(null);

            service['combatRound'](MOCK_SESSION_ID);

            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });
    });

    describe('resetCombatPosture', () => {
        it('should reset combat postures', () => {
            const combatState: CombatState = {
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAPosture: CombatPosture.OFFENSIVE,
                playerBPosture: CombatPosture.DEFENSIVE,
                playerATileEffect: TileCombatEffect.BASE,
                playerBTileEffect: TileCombatEffect.BASE,
            };
            (service as unknown as { activeCombats: Map<string, CombatState> }).activeCombats.set(MOCK_SESSION_ID, combatState);

            service['resetCombatPosture'](MOCK_SESSION_ID);

            expect(combatState.playerAPosture).toBeNull();
            expect(combatState.playerBPosture).toBeNull();
        });

        it('should return early when combat not found', () => {
            service['resetCombatPosture'](MOCK_SESSION_ID);

            expect(true).toBe(true);
        });
    });

    describe('handlePlayerDeath', () => {
        it('should handle player death', () => {
            const session = createMockSession();
            mockRepository.playerHasFlag.mockReturnValue(false);

            service['handlePlayerDeath'](MOCK_SESSION_ID, session, MOCK_PLAYER_ID_1);

            expect(mockMovementService.movePlayerToStartPosition).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1);
            expect(mockRepository.resetPlayerHealth).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
        });

        it('should drop flag when player has flag', () => {
            const session = createMockSession();
            mockRepository.playerHasFlag.mockReturnValue(true);

            service['handlePlayerDeath'](MOCK_SESSION_ID, session, MOCK_PLAYER_ID_1);

            expect(mockRepository.dropFlag).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
        });
    });

    describe('getPlayerDefense', () => {
        it('should return default values when session not found', () => {
            mockRepository.findById.mockReturnValue(null);

            const result = service['getPlayerDefense'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, null, TileCombatEffect.BASE);

            expect(result).toEqual({
                dice: Dice.D4,
                diceRoll: 0,
                baseDefense: 0,
                defenseBonus: 0,
                postureBonus: 0,
                totalDefense: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            });
        });

        it('should return default values when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            mockRepository.findById.mockReturnValue(session);

            const result = service['getPlayerDefense'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, null, TileCombatEffect.BASE);

            expect(result).toEqual({
                dice: Dice.D4,
                diceRoll: 0,
                baseDefense: 0,
                defenseBonus: 0,
                postureBonus: 0,
                totalDefense: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            });
        });

        it('should calculate defense with DEFENSIVE posture bonus', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            const result = service['getPlayerDefense'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.DEFENSIVE, TileCombatEffect.BASE);

            expect(result.postureBonus).toBe(MOCK_POSTURE_BONUS);
            expect(result.totalDefense).toBeGreaterThan(0);

            Math.random = originalRandom;
        });

        it('should calculate defense with admin mode active', () => {
            const session = createMockSession({ isAdminModeActive: true });
            mockRepository.findById.mockReturnValue(session);

            const result = service['getPlayerDefense'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, null, TileCombatEffect.BASE);

            expect(result.diceRoll).toBe(1);
        });
    });

    describe('getPlayerAttack', () => {
        it('should return default values when session not found', () => {
            mockRepository.findById.mockReturnValue(null);

            const result = service['getPlayerAttack'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, null, TileCombatEffect.BASE);

            expect(result).toEqual({
                dice: Dice.D4,
                diceRoll: 0,
                baseAttack: 0,
                attackBonus: 0,
                postureBonus: 0,
                totalAttack: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            });
        });

        it('should return default values when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            mockRepository.findById.mockReturnValue(session);

            const result = service['getPlayerAttack'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, null, TileCombatEffect.BASE);

            expect(result).toEqual({
                dice: Dice.D4,
                diceRoll: 0,
                baseAttack: 0,
                attackBonus: 0,
                postureBonus: 0,
                totalAttack: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            });
        });

        it('should calculate attack with OFFENSIVE posture bonus', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            const result = service['getPlayerAttack'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.OFFENSIVE, TileCombatEffect.BASE);

            expect(result.postureBonus).toBe(MOCK_POSTURE_BONUS);
            expect(result.totalAttack).toBeGreaterThan(0);

            Math.random = originalRandom;
        });

        it('should calculate attack with admin mode active', () => {
            const session = createMockSession({ isAdminModeActive: true });
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, attackDice: Dice.D6 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);

            const result = service['getPlayerAttack'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, null, TileCombatEffect.BASE);

            expect(result.diceRoll).toBe(DiceSides.D6);
        });
    });

    describe('calculateDamage', () => {
        it('should calculate damage when attack > defense', () => {
            const result = service['calculateDamage'](MOCK_BASE_ATTACK, MOCK_BASE_DEFENSE);

            expect(result).toBe(MOCK_BASE_ATTACK - MOCK_BASE_DEFENSE);
        });

        it('should return 0 when attack <= defense', () => {
            const result = service['calculateDamage'](MOCK_BASE_DEFENSE, MOCK_BASE_ATTACK);

            expect(result).toBe(0);
        });
    });

    describe('rollDice', () => {
        it('should return max dice value when admin mode active and isAttack', () => {
            const session = createMockSession({ isAdminModeActive: true });
            mockRepository.findById.mockReturnValue(session);

            const result = service['rollDice'](Dice.D6, MOCK_SESSION_ID, true);

            expect(result).toBe(DiceSides.D6);
        });

        it('should return 1 when admin mode active and not isAttack', () => {
            const session = createMockSession({ isAdminModeActive: true });
            mockRepository.findById.mockReturnValue(session);

            const result = service['rollDice'](Dice.D6, MOCK_SESSION_ID, false);

            expect(result).toBe(1);
        });

        it('should return random value when admin mode not active', () => {
            const session = createMockSession({ isAdminModeActive: false });
            mockRepository.findById.mockReturnValue(session);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            const result = service['rollDice'](Dice.D6, MOCK_SESSION_ID, true);

            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(DiceSides.D6);

            Math.random = originalRandom;
        });
    });

    describe('checkGameVictory', () => {
        it('should emit GameOver when combat wins threshold reached in CLASSIC mode', () => {
            const session = createMockSession({ mode: GameMode.CLASSIC });
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, combatWins: MOCK_COMBAT_WINS });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);

            service['checkGameVictory'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);

            expect(mockTimerService.clearTimerForSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.GameOver,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    winnerId: MOCK_PLAYER_ID_1,
                    winnerName: MOCK_PLAYER_NAME_1,
                }),
            );
        });

        it('should end combat when combat wins threshold not reached', () => {
            const session = createMockSession({ mode: GameMode.CLASSIC });
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, combatWins: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);

            service['checkGameVictory'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.CombatVictory,
                expect.objectContaining({
                    winnerId: MOCK_PLAYER_ID_1,
                }),
            );
        });

        it('should end combat when CTF mode', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, combatWins: MOCK_COMBAT_WINS });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);

            service['checkGameVictory'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.CombatVictory,
                expect.objectContaining({
                    winnerId: MOCK_PLAYER_ID_1,
                }),
            );
        });
    });

    describe('emitVirtualPlayerCombatVictoryIfNeeded', () => {
        it('should emit event when playerA is virtual', () => {
            mockRepository.isVirtualPlayer.mockReturnValueOnce(true).mockReturnValueOnce(false);

            service['emitVirtualPlayerCombatVictoryIfNeeded'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.VirtualPlayerCombatVictory,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    winnerId: MOCK_PLAYER_ID_1,
                    attackerId: MOCK_PLAYER_ID_1,
                }),
            );
        });

        it('should emit event when playerB is virtual', () => {
            mockRepository.isVirtualPlayer.mockReturnValueOnce(false).mockReturnValueOnce(true);

            service['emitVirtualPlayerCombatVictoryIfNeeded'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_2);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.VirtualPlayerCombatVictory,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    winnerId: MOCK_PLAYER_ID_2,
                    attackerId: MOCK_PLAYER_ID_1,
                }),
            );
        });

        it('should not emit event when neither player is virtual', () => {
            mockRepository.isVirtualPlayer.mockReturnValue(false);

            service['emitVirtualPlayerCombatVictoryIfNeeded'](MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1);

            expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.VirtualPlayerCombatVictory, expect.anything());
        });
    });
});
