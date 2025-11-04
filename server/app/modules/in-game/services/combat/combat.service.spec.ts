/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { COMBAT_WINS_TO_WIN_GAME } from '@app/constants/game-config.constants';
import { DiceSides } from '@app/enums/dice-sides.enum';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { CombatTimerService } from '@app/modules/in-game/services/combat-timer/combat-timer.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameMovementService } from '@app/modules/in-game/services/in-game-movement/in-game-movement.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { Dice } from '@common/enums/dice.enum';
import { ServerEvents } from '@app/enums/server-events.enum';
import { TileCombatEffect, TileKind } from '@common/enums/tile.enum';
import { CombatState } from '@common/interfaces/combat.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { CombatService } from './combat.service';
import { CombatPosture } from '@common/enums/combat-posture.enum';

type PlayerAttackResult = {
    dice: Dice;
    diceRoll: number;
    baseAttack: number;
    attackBonus: number;
    totalAttack: number;
    tileCombatEffect: TileCombatEffect;
};

type PlayerDefenseResult = {
    dice: Dice;
    diceRoll: number;
    baseDefense: number;
    defenseBonus: number;
    totalDefense: number;
    tileCombatEffect: TileCombatEffect;
};

type TileWithPlayerId = Tile & { playerId: string | null };

describe('CombatService', () => {
    let service: CombatService;
    let eventEmitter: jest.Mocked<EventEmitter2>;
    let timerService: jest.Mocked<TimerService>;
    let combatTimerService: jest.Mocked<CombatTimerService>;
    let sessionRepository: jest.Mocked<InGameSessionRepository>;
    let inGameMovementService: jest.Mocked<InGameMovementService>;
    let gameCacheService: jest.Mocked<GameCacheService>;

    const SESSION_ID = 'session-1';
    const PLAYER_A_ID = 'player-a';
    const PLAYER_B_ID = 'player-b';
    const PLAYER_C_ID = 'player-c';

    const RANDOM_VALUE = 0.5;
    const INVALID_POSITION = 99;
    const HEALTH_AFTER_DAMAGE_1 = 90;
    const HEALTH_AFTER_DAMAGE_2 = 95;
    const HEALTH_AFTER_DAMAGE_3 = 50;
    const BASE_DEFENSE_VALUE = 5;
    const BASE_ATTACK_VALUE = 10;

    const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: SESSION_ID,
        inGameId: 'in-game-1',
        gameId: 'game-1',
        maxPlayers: 4,
        isGameStarted: true,
        inGamePlayers: {
            [PLAYER_A_ID]: {
                id: PLAYER_A_ID,
                name: 'Player A',
                avatar: null,
                isAdmin: false,
                baseHealth: 100,
                healthBonus: 0,
                health: 100,
                maxHealth: 100,
                baseSpeed: 3,
                speedBonus: 0,
                speed: 3,
                baseAttack: 10,
                attackBonus: 0,
                attack: 10,
                baseDefense: 5,
                defenseBonus: 0,
                defense: 5,
                attackDice: Dice.D6,
                defenseDice: Dice.D4,
                x: 0,
                y: 0,
                isInGame: true,
                startPointId: 'start-1',
                actionsRemaining: 1,
                combatCount: 0,
                combatWins: 0,
                combatLosses: 0,
                combatDraws: 0,
            },
            [PLAYER_B_ID]: {
                id: PLAYER_B_ID,
                name: 'Player B',
                avatar: null,
                isAdmin: false,
                baseHealth: 100,
                healthBonus: 0,
                health: 100,
                maxHealth: 100,
                baseSpeed: 3,
                speedBonus: 0,
                speed: 3,
                baseAttack: 10,
                attackBonus: 0,
                attack: 10,
                baseDefense: 5,
                defenseBonus: 0,
                defense: 5,
                attackDice: Dice.D6,
                defenseDice: Dice.D4,
                x: 1,
                y: 1,
                isInGame: true,
                startPointId: 'start-2',
                actionsRemaining: 1,
                combatCount: 0,
                combatWins: 0,
                combatLosses: 0,
                combatDraws: 0,
            },
        },
        currentTurn: { turnNumber: 1, activePlayerId: PLAYER_A_ID, hasUsedAction: false },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
        isAdminModeActive: false,
        ...overrides,
    });

    const createMockCombatState = (overrides: Partial<CombatState> = {}): CombatState => ({
        sessionId: SESSION_ID,
        playerAId: PLAYER_A_ID,
        playerBId: PLAYER_B_ID,
        playerAPosture: null,
        playerBPosture: null,
        playerATileEffect: TileCombatEffect.BASE,
        playerBTileEffect: TileCombatEffect.BASE,
        ...overrides,
    });

    beforeEach(async () => {
        const mockEventEmitter = {
            emit: jest.fn(),
        };

        const mockTimerService = {
            pauseTurnTimer: jest.fn(),
            resumeTurnTimer: jest.fn(),
            endTurnManual: jest.fn(),
            forceStopTimer: jest.fn(),
        };

        const mockCombatTimerService = {
            startCombatTimer: jest.fn(),
            stopCombatTimer: jest.fn(),
            forceNextLoop: jest.fn(),
        };

        const mockSessionRepository = {
            findById: jest.fn(),
            incrementPlayerCombatCount: jest.fn(),
            decreasePlayerHealth: jest.fn(),
            resetPlayerHealth: jest.fn(),
            incrementPlayerCombatWins: jest.fn(),
            incrementPlayerCombatLosses: jest.fn(),
            incrementPlayerCombatDraws: jest.fn(),
        };

        const mockInGameMovementService = {
            movePlayerToStartPosition: jest.fn(),
            calculateReachableTiles: jest.fn(),
        };

        const mockGameCacheService = {
            getTileByPlayerId: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatService,
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitter,
                },
                {
                    provide: TimerService,
                    useValue: mockTimerService,
                },
                {
                    provide: CombatTimerService,
                    useValue: mockCombatTimerService,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockSessionRepository,
                },
                {
                    provide: InGameMovementService,
                    useValue: mockInGameMovementService,
                },
                {
                    provide: GameCacheService,
                    useValue: mockGameCacheService,
                },
            ],
        }).compile();

        service = module.get<CombatService>(CombatService);
        eventEmitter = module.get(EventEmitter2);
        timerService = module.get(TimerService);
        combatTimerService = module.get(CombatTimerService);
        sessionRepository = module.get(InGameSessionRepository);
        inGameMovementService = module.get(InGameMovementService);
        gameCacheService = module.get(GameCacheService);

        jest.spyOn(Math, 'random').mockReturnValue(RANDOM_VALUE);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getSession', () => {
        it('should return session from repository', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            const result = service.getSession(SESSION_ID);

            expect(result).toBe(session);
            expect(sessionRepository.findById).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('combatAbandon', () => {
        it('should throw NotFoundException when combat not found', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.combatAbandon(SESSION_ID, PLAYER_A_ID)).toThrow(NotFoundException);
            expect(() => service.combatAbandon(SESSION_ID, PLAYER_A_ID)).toThrow('Combat not found');
        });

        it('should throw BadRequestException when player not in combat', () => {
            const session = createMockSession();
            const combat = createMockCombatState();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            expect(() => service.combatAbandon(SESSION_ID, PLAYER_C_ID)).toThrow(BadRequestException);
            expect(() => service.combatAbandon(SESSION_ID, PLAYER_C_ID)).toThrow('Player not in combat');
        });

        it('should throw NotFoundException when session not found', () => {
            const combat = createMockCombatState();
            sessionRepository.findById.mockReturnValue(null);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            expect(() => service.combatAbandon(SESSION_ID, PLAYER_A_ID)).toThrow(NotFoundException);
            expect(() => service.combatAbandon(SESSION_ID, PLAYER_A_ID)).toThrow('Session not found');
        });

        it('should end combat with playerB as winner when playerA abandons', () => {
            const session = createMockSession();
            const combat = createMockCombatState();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                endCombat: (session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);
            const endCombatSpy = jest.spyOn(servicePrivate, 'endCombat');

            service.combatAbandon(SESSION_ID, PLAYER_A_ID);

            expect(endCombatSpy).toHaveBeenCalledWith(session, PLAYER_A_ID, PLAYER_B_ID, PLAYER_B_ID, true);
        });

        it('should end combat with playerA as winner when playerB abandons', () => {
            const session = createMockSession();
            const combat = createMockCombatState();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                endCombat: (session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);
            const endCombatSpy = jest.spyOn(servicePrivate, 'endCombat');

            service.combatAbandon(SESSION_ID, PLAYER_B_ID);

            expect(endCombatSpy).toHaveBeenCalledWith(session, PLAYER_A_ID, PLAYER_B_ID, PLAYER_A_ID, true);
        });
    });

    describe('attackPlayerAction', () => {
        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            session.inGamePlayers = {};
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.attackPlayerAction(SESSION_ID, PLAYER_A_ID, 0, 0)).toThrow(NotFoundException);
            expect(() => service.attackPlayerAction(SESSION_ID, PLAYER_A_ID, 0, 0)).toThrow('Player not found');
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = 0;
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.attackPlayerAction(SESSION_ID, PLAYER_A_ID, 1, 1)).toThrow(BadRequestException);
            expect(() => service.attackPlayerAction(SESSION_ID, PLAYER_A_ID, 1, 1)).toThrow('No actions remaining');
        });

        it('should throw BadRequestException when no opponent at position', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.attackPlayerAction(SESSION_ID, PLAYER_A_ID, INVALID_POSITION, INVALID_POSITION)).toThrow(
                BadRequestException,
            );
            expect(() => service.attackPlayerAction(SESSION_ID, PLAYER_A_ID, INVALID_POSITION, INVALID_POSITION)).toThrow(
                'No opponent at this position',
            );
        });

        it('should throw BadRequestException when attacking own position', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.attackPlayerAction(SESSION_ID, PLAYER_A_ID, 0, 0)).toThrow(BadRequestException);
            expect(() => service.attackPlayerAction(SESSION_ID, PLAYER_A_ID, 0, 0)).toThrow('No opponent at this position');
        });

        it('should start combat and decrement actions', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);
            gameCacheService.getTileByPlayerId.mockReturnValue({ kind: TileKind.BASE, x: 0, y: 0, playerId: null } as TileWithPlayerId);

            type ServiceWithPrivateMethod = {
                startCombat: (session: InGameSession, playerAId: string, playerBId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            const startCombatSpy = jest.spyOn(servicePrivate, 'startCombat');

            service.attackPlayerAction(SESSION_ID, PLAYER_A_ID, 1, 1);

            expect(session.inGamePlayers[PLAYER_A_ID].actionsRemaining).toBe(0);
            expect(session.currentTurn.hasUsedAction).toBe(true);
            expect(startCombatSpy).toHaveBeenCalledWith(session, PLAYER_A_ID, PLAYER_B_ID);
        });
    });

    describe('combatChoice', () => {
        it('should return early when combat not found', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            expect(() => service.combatChoice(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE)).not.toThrow();
            expect(eventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when player not in combat (line 66 check)', () => {
            const combat = createMockCombatState();
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            expect(() => service.combatChoice(SESSION_ID, PLAYER_C_ID, CombatPosture.OFFENSIVE)).toThrow(BadRequestException);
            expect(() => service.combatChoice(SESSION_ID, PLAYER_C_ID, CombatPosture.OFFENSIVE)).toThrow('Player not in combat');
        });

        it('should throw BadRequestException when player not in combat (line 66 check)', () => {
            const combat = createMockCombatState();
            combat.playerAId = 'different-a';
            combat.playerBId = 'different-b';
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            expect(() => service.combatChoice(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE)).toThrow(BadRequestException);
            expect(() => service.combatChoice(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE)).toThrow('Player not in combat');
        });

        it('should throw BadRequestException from else branch (line 72) when player matches neither A nor B', () => {
            const combat = createMockCombatState();
            combat.playerAId = 'wrong-player-a';
            combat.playerBId = 'wrong-player-b';
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            expect(() => service.combatChoice(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE)).toThrow(BadRequestException);
            expect(() => service.combatChoice(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE)).toThrow('Player not in combat');
        });

        it('should set playerA posture and emit event', () => {
            const combat = createMockCombatState();
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            service.combatChoice(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE);

            expect(combat.playerAPosture).toBe(CombatPosture.OFFENSIVE);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatPostureSelected, {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                posture: CombatPosture.OFFENSIVE,
            });
        });

        it('should set playerB posture and emit event', () => {
            const combat = createMockCombatState();
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            service.combatChoice(SESSION_ID, PLAYER_B_ID, CombatPosture.DEFENSIVE);

            expect(combat.playerBPosture).toBe(CombatPosture.DEFENSIVE);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatPostureSelected, {
                sessionId: SESSION_ID,
                playerId: PLAYER_B_ID,
                posture: CombatPosture.DEFENSIVE,
            });
        });

        it('should force next loop when both postures are set', () => {
            const combat = createMockCombatState();
            combat.playerAPosture = CombatPosture.OFFENSIVE;
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            service.combatChoice(SESSION_ID, PLAYER_B_ID, CombatPosture.DEFENSIVE);

            expect(combatTimerService.forceNextLoop).toHaveBeenCalledWith(session);
        });

        it('should not force next loop when only one posture is set', () => {
            const combat = createMockCombatState();
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            service.combatChoice(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE);

            expect(combatTimerService.forceNextLoop).not.toHaveBeenCalled();
        });

        it('should handle playerB choice when playerA condition is false', () => {
            const combat = createMockCombatState();
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            service.combatChoice(SESSION_ID, PLAYER_B_ID, CombatPosture.OFFENSIVE);

            expect(combat.playerBPosture).toBe(CombatPosture.OFFENSIVE);
            expect(combat.playerAPosture).toBeNull();
        });

        it('should execute else if branch when playerA is not the player but playerB is', () => {
            const combat = createMockCombatState();
            combat.playerAId = 'different-player';
            combat.playerBId = PLAYER_B_ID;
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            service.combatChoice(SESSION_ID, PLAYER_B_ID, CombatPosture.DEFENSIVE);

            expect(combat.playerAPosture).toBeNull();
            expect(combat.playerBPosture).toBe(CombatPosture.DEFENSIVE);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatPostureSelected, {
                sessionId: SESSION_ID,
                playerId: PLAYER_B_ID,
                posture: CombatPosture.DEFENSIVE,
            });
        });

        it('should execute else branch when both if and else if conditions are false', () => {
            const combat = createMockCombatState();
            combat.playerAId = 'wrong-player-a';
            combat.playerBId = 'wrong-player-b';
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            expect(() => service.combatChoice(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE)).toThrow(BadRequestException);
            expect(() => service.combatChoice(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE)).toThrow('Player not in combat');
        });
    });

    describe('startCombat', () => {
        it('should create combat state and start timer', () => {
            const session = createMockSession();
            gameCacheService.getTileByPlayerId.mockReturnValue({ kind: TileKind.BASE, x: 0, y: 0, playerId: null } as TileWithPlayerId);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            service.startCombat(session, PLAYER_A_ID, PLAYER_B_ID);

            expect(servicePrivate.activeCombats.has(SESSION_ID)).toBe(true);
            const combat = servicePrivate.activeCombats.get(SESSION_ID);
            expect(combat?.playerAId).toBe(PLAYER_A_ID);
            expect(combat?.playerBId).toBe(PLAYER_B_ID);
            expect(timerService.pauseTurnTimer).toHaveBeenCalledWith(SESSION_ID);
            expect(combatTimerService.startCombatTimer).toHaveBeenCalledWith(
                session,
                PLAYER_A_ID,
                PLAYER_B_ID,
                TileCombatEffect.BASE,
                TileCombatEffect.BASE,
            );
            expect(sessionRepository.incrementPlayerCombatCount).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID);
            expect(sessionRepository.incrementPlayerCombatCount).toHaveBeenCalledWith(SESSION_ID, PLAYER_B_ID);
        });

        it('should use default tile effect when tile is null', () => {
            const session = createMockSession();
            gameCacheService.getTileByPlayerId.mockReturnValue(null);

            service.startCombat(session, PLAYER_A_ID, PLAYER_B_ID);

            expect(combatTimerService.startCombatTimer).toHaveBeenCalledWith(
                session,
                PLAYER_A_ID,
                PLAYER_B_ID,
                0,
                0,
            );
        });

        it('should use tile combat effect from tile kind', () => {
            const session = createMockSession();
            gameCacheService.getTileByPlayerId
                .mockReturnValueOnce({ kind: TileKind.ICE, x: 0, y: 0, playerId: null } as TileWithPlayerId)
                .mockReturnValueOnce({ kind: TileKind.WATER, x: 0, y: 0, playerId: null } as TileWithPlayerId);

            service.startCombat(session, PLAYER_A_ID, PLAYER_B_ID);

            expect(combatTimerService.startCombatTimer).toHaveBeenCalledWith(
                session,
                PLAYER_A_ID,
                PLAYER_B_ID,
                TileCombatEffect.ICE,
                TileCombatEffect.WATER,
            );
        });
    });

    describe('handleTimerLoop', () => {
        it('should call combatRound when combat exists', () => {
            const combat = createMockCombatState();

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                combatRound: (sessionId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);
            const combatRoundSpy = jest.spyOn(servicePrivate, 'combatRound');

            service.handleTimerLoop({ sessionId: SESSION_ID });

            expect(combatRoundSpy).toHaveBeenCalledWith(SESSION_ID);
        });

        it('should not call combatRound when combat does not exist', () => {
            type ServiceWithPrivateMethod = {
                combatRound: (sessionId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            const combatRoundSpy = jest.spyOn(servicePrivate, 'combatRound');

            service.handleTimerLoop({ sessionId: SESSION_ID });

            expect(combatRoundSpy).not.toHaveBeenCalled();
        });
    });

    describe('endCombat', () => {
        it('should end turn when winnerId is null', () => {
            const session = createMockSession();
            const combat = createMockCombatState();

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                endCombat: (session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            servicePrivate.endCombat(session, PLAYER_A_ID, PLAYER_B_ID, null, false);

            expect(servicePrivate.activeCombats.has(SESSION_ID)).toBe(false);
            expect(combatTimerService.stopCombatTimer).toHaveBeenCalledWith(session);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.CombatVictory, {
                sessionId: SESSION_ID,
                playerAId: PLAYER_A_ID,
                playerBId: PLAYER_B_ID,
                winnerId: null,
                abandon: false,
            });
            expect(timerService.endTurnManual).toHaveBeenCalledWith(session);
        });

        it('should end turn when winnerId is different from active player', () => {
            const session = createMockSession();
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            const combat = createMockCombatState();

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                endCombat: (session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            servicePrivate.endCombat(session, PLAYER_A_ID, PLAYER_B_ID, PLAYER_B_ID, false);

            expect(timerService.endTurnManual).toHaveBeenCalledWith(session);
            expect(timerService.resumeTurnTimer).not.toHaveBeenCalled();
        });

        it('should resume timer when winnerId is same as active player', () => {
            const session = createMockSession();
            session.currentTurn.activePlayerId = PLAYER_A_ID;
            const combat = createMockCombatState();

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                endCombat: (session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            servicePrivate.endCombat(session, PLAYER_A_ID, PLAYER_B_ID, PLAYER_A_ID, false);

            expect(timerService.resumeTurnTimer).toHaveBeenCalledWith(SESSION_ID);
            expect(inGameMovementService.calculateReachableTiles).toHaveBeenCalledWith(session, PLAYER_A_ID);
            expect(timerService.endTurnManual).not.toHaveBeenCalled();
        });
    });

    describe('combatRound', () => {
        it('should return early when combat not found', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                combatRound: (sessionId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            expect(() => servicePrivate.combatRound(SESSION_ID)).not.toThrow();
            expect(eventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should return early when session not found', () => {
            const combat = createMockCombatState();
            sessionRepository.findById.mockReturnValue(null);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                combatRound: (sessionId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            expect(() => servicePrivate.combatRound(SESSION_ID)).not.toThrow();
            expect(eventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should process combat round and emit events', () => {
            const session = createMockSession();
            const combat = createMockCombatState();
            combat.playerAPosture = CombatPosture.OFFENSIVE;
            combat.playerBPosture = CombatPosture.DEFENSIVE;
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.decreasePlayerHealth.mockReturnValueOnce(HEALTH_AFTER_DAMAGE_1).mockReturnValueOnce(HEALTH_AFTER_DAMAGE_2);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                combatRound: (sessionId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            servicePrivate.combatRound(SESSION_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerHealthChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                newHealth: HEALTH_AFTER_DAMAGE_1,
            });
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerHealthChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_B_ID,
                newHealth: HEALTH_AFTER_DAMAGE_2,
            });
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatResult, expect.objectContaining({
                sessionId: SESSION_ID,
                playerAId: PLAYER_A_ID,
                playerBId: PLAYER_B_ID,
            }));
            expect(combat.playerAPosture).toBeNull();
            expect(combat.playerBPosture).toBeNull();
        });

        it('should handle playerA death', () => {
            const session = createMockSession();
            const combat = createMockCombatState();
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.decreasePlayerHealth.mockReturnValueOnce(0).mockReturnValueOnce(HEALTH_AFTER_DAMAGE_3);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                combatRound: (sessionId: string) => void;
                checkGameVictory: (sessionId: string, winnerId: string, playerAId: string, playerBId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);
            const checkGameVictorySpy = jest.spyOn(servicePrivate, 'checkGameVictory');

            servicePrivate.combatRound(SESSION_ID);

            expect(inGameMovementService.movePlayerToStartPosition).toHaveBeenCalledWith(session, PLAYER_A_ID);
            expect(sessionRepository.resetPlayerHealth).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID);
            expect(sessionRepository.incrementPlayerCombatWins).toHaveBeenCalledWith(SESSION_ID, PLAYER_B_ID);
            expect(sessionRepository.incrementPlayerCombatLosses).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID);
            expect(checkGameVictorySpy).toHaveBeenCalledWith(SESSION_ID, PLAYER_B_ID, PLAYER_A_ID, PLAYER_B_ID);
        });

        it('should handle playerB death', () => {
            const session = createMockSession();
            const combat = createMockCombatState();
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.decreasePlayerHealth.mockReturnValueOnce(HEALTH_AFTER_DAMAGE_3).mockReturnValueOnce(0);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                combatRound: (sessionId: string) => void;
                checkGameVictory: (sessionId: string, winnerId: string, playerAId: string, playerBId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);
            const checkGameVictorySpy = jest.spyOn(servicePrivate, 'checkGameVictory');

            servicePrivate.combatRound(SESSION_ID);

            expect(inGameMovementService.movePlayerToStartPosition).toHaveBeenCalledWith(session, PLAYER_B_ID);
            expect(sessionRepository.resetPlayerHealth).toHaveBeenCalledWith(SESSION_ID, PLAYER_B_ID);
            expect(sessionRepository.incrementPlayerCombatWins).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID);
            expect(sessionRepository.incrementPlayerCombatLosses).toHaveBeenCalledWith(SESSION_ID, PLAYER_B_ID);
            expect(checkGameVictorySpy).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID, PLAYER_A_ID, PLAYER_B_ID);
        });

        it('should handle draw (both players dead)', () => {
            const session = createMockSession();
            const combat = createMockCombatState();
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.decreasePlayerHealth.mockReturnValueOnce(0).mockReturnValueOnce(0);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                combatRound: (sessionId: string) => void;
                endCombat: (session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);
            const endCombatSpy = jest.spyOn(servicePrivate, 'endCombat');

            servicePrivate.combatRound(SESSION_ID);

            expect(inGameMovementService.movePlayerToStartPosition).toHaveBeenCalledWith(session, PLAYER_A_ID);
            expect(inGameMovementService.movePlayerToStartPosition).toHaveBeenCalledWith(session, PLAYER_B_ID);
            expect(sessionRepository.resetPlayerHealth).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID);
            expect(sessionRepository.resetPlayerHealth).toHaveBeenCalledWith(SESSION_ID, PLAYER_B_ID);
            expect(sessionRepository.incrementPlayerCombatDraws).toHaveBeenCalledWith(SESSION_ID, PLAYER_A_ID);
            expect(sessionRepository.incrementPlayerCombatDraws).toHaveBeenCalledWith(SESSION_ID, PLAYER_B_ID);
            expect(endCombatSpy).toHaveBeenCalledWith(session, PLAYER_A_ID, PLAYER_B_ID, null);
        });

        it('should not end combat when both players alive', () => {
            const session = createMockSession();
            const combat = createMockCombatState();
            sessionRepository.findById.mockReturnValue(session);
            sessionRepository.decreasePlayerHealth.mockReturnValueOnce(HEALTH_AFTER_DAMAGE_3).mockReturnValueOnce(HEALTH_AFTER_DAMAGE_3);

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                combatRound: (sessionId: string) => void;
                endCombat: (session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);
            const endCombatSpy = jest.spyOn(servicePrivate, 'endCombat');

            servicePrivate.combatRound(SESSION_ID);

            expect(endCombatSpy).not.toHaveBeenCalled();
            expect(inGameMovementService.movePlayerToStartPosition).not.toHaveBeenCalled();
        });
    });

    describe('resetCombatPosture', () => {
        it('should reset postures when combat exists', () => {
            const combat = createMockCombatState();
            combat.playerAPosture = CombatPosture.OFFENSIVE;
            combat.playerBPosture = CombatPosture.DEFENSIVE;

            type ServiceWithPrivateMethod = {
                activeCombats: Map<string, CombatState>;
                resetCombatPosture: (sessionId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            servicePrivate.activeCombats.set(SESSION_ID, combat);

            servicePrivate.resetCombatPosture(SESSION_ID);

            expect(combat.playerAPosture).toBeNull();
            expect(combat.playerBPosture).toBeNull();
        });

        it('should return early when combat not found', () => {
            type ServiceWithPrivateMethod = {
                resetCombatPosture: (sessionId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            expect(() => servicePrivate.resetCombatPosture(SESSION_ID)).not.toThrow();
        });
    });

    describe('getPlayerDefense', () => {
        it('should return default values when session not found', () => {
            sessionRepository.findById.mockReturnValue(null);

            type ServiceWithPrivateMethod = {
                getPlayerDefense: (
                    sessionId: string,
                    playerId: string,
                    posture: CombatPosture.OFFENSIVE | CombatPosture.DEFENSIVE,
                    tileCombatEffect: TileCombatEffect,
                ) => PlayerDefenseResult;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.getPlayerDefense(SESSION_ID, PLAYER_A_ID, CombatPosture.DEFENSIVE, TileCombatEffect.BASE);

            expect(result).toEqual({
                dice: Dice.D4,
                diceRoll: 0,
                baseDefense: 0,
                defenseBonus: 0,
                totalDefense: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            });
        });

        it('should return default values when player not found', () => {
            const session = createMockSession();
            session.inGamePlayers = {};
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                getPlayerDefense: (
                    sessionId: string,
                    playerId: string,
                    posture: CombatPosture.OFFENSIVE | CombatPosture.DEFENSIVE,
                    tileCombatEffect: TileCombatEffect,
                ) => PlayerDefenseResult;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.getPlayerDefense(SESSION_ID, PLAYER_A_ID, CombatPosture.DEFENSIVE, TileCombatEffect.BASE);

            expect(result).toEqual({
                dice: Dice.D4,
                diceRoll: 0,
                baseDefense: 0,
                defenseBonus: 0,
                totalDefense: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            });
        });

        it('should calculate defense with defensive posture bonus', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                getPlayerDefense: (
                    sessionId: string,
                    playerId: string,
                    posture: CombatPosture.OFFENSIVE | CombatPosture.DEFENSIVE,
                    tileCombatEffect: TileCombatEffect,
                ) => PlayerDefenseResult;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.getPlayerDefense(SESSION_ID, PLAYER_A_ID, CombatPosture.DEFENSIVE, TileCombatEffect.BASE);

            expect(result.dice).toBe(Dice.D4);
            expect(result.baseDefense).toBe(BASE_DEFENSE_VALUE);
            expect(result.defenseBonus).toBe(2);
            expect(result.totalDefense).toBeGreaterThan(0);
        });

        it('should calculate defense without bonus for offensive posture', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                getPlayerDefense: (
                    sessionId: string,
                    playerId: string,
                    posture: CombatPosture.OFFENSIVE | CombatPosture.DEFENSIVE,
                    tileCombatEffect: TileCombatEffect,
                ) => PlayerDefenseResult;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.getPlayerDefense(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE, TileCombatEffect.BASE);

            expect(result.defenseBonus).toBe(0);
        });
    });

    describe('getPlayerAttack', () => {
        it('should return default values when session not found', () => {
            sessionRepository.findById.mockReturnValue(null);

            type ServiceWithPrivateMethod = {
                getPlayerAttack: (
                    sessionId: string,
                    playerId: string,
                    posture: CombatPosture.OFFENSIVE | CombatPosture.DEFENSIVE,
                    tileCombatEffect: TileCombatEffect,
                ) => PlayerAttackResult;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.getPlayerAttack(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE, TileCombatEffect.BASE);

            expect(result).toEqual({
                dice: Dice.D4,
                diceRoll: 0,
                baseAttack: 0,
                attackBonus: 0,
                totalAttack: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            });
        });

        it('should return default values when player not found', () => {
            const session = createMockSession();
            session.inGamePlayers = {};
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                getPlayerAttack: (
                    sessionId: string,
                    playerId: string,
                    posture: CombatPosture.OFFENSIVE | CombatPosture.DEFENSIVE,
                    tileCombatEffect: TileCombatEffect,
                ) => PlayerAttackResult;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.getPlayerAttack(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE, TileCombatEffect.BASE);

            expect(result).toEqual({
                dice: Dice.D4,
                diceRoll: 0,
                baseAttack: 0,
                attackBonus: 0,
                totalAttack: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            });
        });

        it('should calculate attack with offensive posture bonus', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                getPlayerAttack: (
                    sessionId: string,
                    playerId: string,
                    posture: CombatPosture.OFFENSIVE | CombatPosture.DEFENSIVE,
                    tileCombatEffect: TileCombatEffect,
                ) => PlayerAttackResult;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.getPlayerAttack(SESSION_ID, PLAYER_A_ID, CombatPosture.OFFENSIVE, TileCombatEffect.BASE);

            expect(result.dice).toBe(Dice.D6);
            expect(result.baseAttack).toBe(BASE_ATTACK_VALUE);
            expect(result.attackBonus).toBe(2);
            expect(result.totalAttack).toBeGreaterThan(0);
        });

        it('should calculate attack without bonus for defensive posture', () => {
            const session = createMockSession();
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                getPlayerAttack: (
                    sessionId: string,
                    playerId: string,
                    posture: CombatPosture.OFFENSIVE | CombatPosture.DEFENSIVE,
                    tileCombatEffect: TileCombatEffect,
                ) => PlayerAttackResult;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.getPlayerAttack(SESSION_ID, PLAYER_A_ID, CombatPosture.DEFENSIVE, TileCombatEffect.BASE);

            expect(result.attackBonus).toBe(0);
        });
    });

    describe('calculateDamage', () => {
        it('should return positive damage when attack > defense', () => {
            type ServiceWithPrivateMethod = {
                calculateDamage: (attack: number, defense: number) => number;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.calculateDamage(BASE_ATTACK_VALUE, BASE_DEFENSE_VALUE);

            expect(result).toBe(BASE_DEFENSE_VALUE);
        });

        it('should return 0 when attack <= defense', () => {
            type ServiceWithPrivateMethod = {
                calculateDamage: (attack: number, defense: number) => number;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.calculateDamage(BASE_DEFENSE_VALUE, BASE_ATTACK_VALUE);

            expect(result).toBe(0);
        });

        it('should return 0 when attack equals defense', () => {
            type ServiceWithPrivateMethod = {
                calculateDamage: (attack: number, defense: number) => number;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.calculateDamage(BASE_ATTACK_VALUE, BASE_ATTACK_VALUE);

            expect(result).toBe(0);
        });
    });

    describe('rollDice', () => {
        it('should return max dice value for attack in admin mode', () => {
            const session = createMockSession();
            session.isAdminModeActive = true;
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                rollDice: (dice: Dice, sessionId: string, isAttack: boolean) => number;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.rollDice(Dice.D6, SESSION_ID, true);

            expect(result).toBe(DiceSides[Dice.D6]);
        });

        it('should return 1 for defense in admin mode', () => {
            const session = createMockSession();
            session.isAdminModeActive = true;
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                rollDice: (dice: Dice, sessionId: string, isAttack: boolean) => number;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.rollDice(Dice.D6, SESSION_ID, false);

            expect(result).toBe(1);
        });

        it('should return random value in normal mode', () => {
            const session = createMockSession();
            session.isAdminModeActive = false;
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                rollDice: (dice: Dice, sessionId: string, isAttack: boolean) => number;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.rollDice(Dice.D6, SESSION_ID, true);

            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(DiceSides[Dice.D6]);
        });

        it('should handle null session', () => {
            sessionRepository.findById.mockReturnValue(null);

            type ServiceWithPrivateMethod = {
                rollDice: (dice: Dice, sessionId: string, isAttack?: boolean) => number;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.rollDice(Dice.D6, SESSION_ID);

            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(DiceSides[Dice.D6]);
        });

        it('should use default isAttack parameter when not provided', () => {
            const session = createMockSession();
            session.isAdminModeActive = true;
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                rollDice: (dice: Dice, sessionId: string, isAttack?: boolean) => number;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            const result = servicePrivate.rollDice(Dice.D6, SESSION_ID);

            expect(result).toBe(DiceSides[Dice.D6]);
        });
    });

    describe('checkGameVictory', () => {
        it('should emit game over when winner has enough wins', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].combatWins = COMBAT_WINS_TO_WIN_GAME;
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                checkGameVictory: (sessionId: string, winnerId: string, playerAId: string, playerBId: string) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;

            servicePrivate.checkGameVictory(SESSION_ID, PLAYER_A_ID, PLAYER_A_ID, PLAYER_B_ID);

            expect(timerService.forceStopTimer).toHaveBeenCalledWith(SESSION_ID);
            expect(combatTimerService.stopCombatTimer).toHaveBeenCalledWith(session);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.GameOver, {
                sessionId: SESSION_ID,
                winnerId: PLAYER_A_ID,
                winnerName: 'Player A',
            });
        });

        it('should end combat when winner does not have enough wins', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].combatWins = COMBAT_WINS_TO_WIN_GAME - 1;
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                checkGameVictory: (sessionId: string, winnerId: string, playerAId: string, playerBId: string) => void;
                endCombat: (session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            const endCombatSpy = jest.spyOn(servicePrivate, 'endCombat');

            servicePrivate.checkGameVictory(SESSION_ID, PLAYER_A_ID, PLAYER_A_ID, PLAYER_B_ID);

            expect(timerService.forceStopTimer).not.toHaveBeenCalled();
            expect(endCombatSpy).toHaveBeenCalledWith(session, PLAYER_A_ID, PLAYER_B_ID, PLAYER_A_ID);
        });

        it('should end combat when winner not found', () => {
            const session = createMockSession();
            session.inGamePlayers = {};
            sessionRepository.findById.mockReturnValue(session);

            type ServiceWithPrivateMethod = {
                checkGameVictory: (sessionId: string, winnerId: string, playerAId: string, playerBId: string) => void;
                endCombat: (session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean) => void;
            };
            const servicePrivate = service as unknown as ServiceWithPrivateMethod;
            const endCombatSpy = jest.spyOn(servicePrivate, 'endCombat');

            servicePrivate.checkGameVictory(SESSION_ID, PLAYER_A_ID, PLAYER_A_ID, PLAYER_B_ID);

            expect(timerService.forceStopTimer).not.toHaveBeenCalled();
            expect(endCombatSpy).toHaveBeenCalledWith(session, PLAYER_A_ID, PLAYER_B_ID, PLAYER_A_ID);
        });
    });
});

