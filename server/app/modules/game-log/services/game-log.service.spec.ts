/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameLogEntryType } from '@common/enums/game-log-entry-type.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { GameLogService } from './game-log.service';

const MOCK_SESSION_ID = 'session-123';
const MOCK_PLAYER_ID_1 = 'player-1';
const MOCK_PLAYER_ID_2 = 'player-2';
const MOCK_PLAYER_NAME_1 = 'Player 1';
const MOCK_PLAYER_NAME_2 = 'Player 2';
const MOCK_X = 5;
const MOCK_Y = 10;
const MOCK_DICE_ROLL = 4;
const MOCK_BASE_ATTACK = 10;
const MOCK_ATTACK_BONUS = 2;
const MOCK_TOTAL_ATTACK = 16;
const MOCK_BASE_DEFENSE = 5;
const MOCK_DEFENSE_BONUS = 1;
const MOCK_TOTAL_DEFENSE = 10;
const MOCK_DAMAGE = 6;
const MOCK_ADDED_HEALTH = 5;
const MOCK_ADDED_DEFENSE = 3;
const MOCK_ADDED_ATTACK = 2;
const MOCK_ORIGIN_X = 1;
const MOCK_ORIGIN_Y = 2;
const MOCK_DESTINATION_X = 3;
const MOCK_DESTINATION_Y = 4;

const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: MOCK_PLAYER_ID_1,
    name: MOCK_PLAYER_NAME_1,
    avatar: Avatar.Avatar1,
    isAdmin: false,
    baseHealth: 100,
    healthBonus: 0,
    health: 100,
    maxHealth: 100,
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

describe('GameLogService', () => {
    let service: GameLogService;
    let mockRepository: jest.Mocked<InGameSessionRepository>;

    beforeEach(async () => {
        const mockRepositoryValue = {
            findById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameLogService,
                {
                    provide: InGameSessionRepository,
                    useValue: mockRepositoryValue,
                },
            ],
        }).compile();

        service = module.get<GameLogService>(GameLogService);
        mockRepository = module.get(InGameSessionRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createTurnStartEntry', () => {
        it('should create turn start entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createTurnStartEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(entry.type).toBe(GameLogEntryType.TurnStart);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('HourglassStart');
        });
    });

    describe('createCombatStartEntry', () => {
        it('should create combat start entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createCombatStartEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);

            expect(entry.type).toBe(GameLogEntryType.CombatStart);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_2);
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1, MOCK_PLAYER_NAME_2]);
            expect(entry.icon).toBe('ShieldHalved');
        });
    });

    describe('createCombatEndEntry', () => {
        it('should create combat end entry with winner', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createCombatEndEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1);

            expect(entry.type).toBe(GameLogEntryType.CombatEnd);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain('vainqueur');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1, MOCK_PLAYER_NAME_2]);
            expect(entry.icon).toBe('ShieldHalved');
        });

        it('should create combat end entry with draw', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createCombatEndEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2, null);

            expect(entry.type).toBe(GameLogEntryType.CombatEnd);
            expect(entry.message).toContain('match nul');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1, MOCK_PLAYER_NAME_2]);
            expect(entry.icon).toBe('ShieldHalved');
        });
    });

    describe('createCombatResultEntry', () => {
        it('should create combat result entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const params = {
                sessionId: MOCK_SESSION_ID,
                attackerId: MOCK_PLAYER_ID_1,
                targetId: MOCK_PLAYER_ID_2,
                attackerAttack: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseAttack: MOCK_BASE_ATTACK,
                    attackBonus: MOCK_ATTACK_BONUS,
                    totalAttack: MOCK_TOTAL_ATTACK,
                },
                targetDefense: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseDefense: MOCK_BASE_DEFENSE,
                    defenseBonus: MOCK_DEFENSE_BONUS,
                    totalDefense: MOCK_TOTAL_DEFENSE,
                },
                damage: MOCK_DAMAGE,
            };

            const entry = service.createCombatResultEntry(params);

            expect(entry.type).toBe(GameLogEntryType.CombatResult);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_2);
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1, MOCK_PLAYER_NAME_2]);
            expect(entry.icon).toBe('Bolt');
            expect(entry.metadata).toBeDefined();
            expect(entry.metadata?.attackerId).toBe(MOCK_PLAYER_ID_1);
            expect(entry.metadata?.targetId).toBe(MOCK_PLAYER_ID_2);
            expect(entry.metadata?.attackTotal).toBe(MOCK_TOTAL_ATTACK);
            expect(entry.metadata?.defenseTotal).toBe(MOCK_TOTAL_DEFENSE);
            expect(entry.metadata?.damage).toBe(MOCK_DAMAGE);
        });
    });

    describe('createDoorToggleEntry', () => {
        it('should create door toggle entry for open door', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createDoorToggleEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_X, MOCK_Y, true);

            expect(entry.type).toBe(GameLogEntryType.DoorToggle);
            expect(entry.message).toContain('ouverte');
            expect(entry.message).toContain(`${MOCK_X}, ${MOCK_Y}`);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Lock');
        });

        it('should create door toggle entry for closed door', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createDoorToggleEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_X, MOCK_Y, false);

            expect(entry.type).toBe(GameLogEntryType.DoorToggle);
            expect(entry.message).toContain('fermée');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Lock');
        });
    });

    describe('createDebugModeToggleEntry', () => {
        it('should create debug mode toggle entry for active', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createDebugModeToggleEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, true);

            expect(entry.type).toBe(GameLogEntryType.DebugModeToggle);
            expect(entry.message).toContain('activé');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Gear');
        });

        it('should create debug mode toggle entry for inactive', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createDebugModeToggleEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, false);

            expect(entry.type).toBe(GameLogEntryType.DebugModeToggle);
            expect(entry.message).toContain('désactivé');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Gear');
        });
    });

    describe('createPlayerAbandonEntry', () => {
        it('should create player abandon entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createPlayerAbandonEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(entry.type).toBe(GameLogEntryType.GameAbandon);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain('abandonné');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('UserMinus');
        });
    });

    describe('createGameOverEntry', () => {
        it('should create game over entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createGameOverEntry(MOCK_SESSION_ID);

            expect(entry.type).toBe(GameLogEntryType.GameOver);
            expect(entry.message).toContain('Fin de partie');
            expect(entry.involvedPlayerIds.length).toBeGreaterThan(0);
            expect(entry.involvedPlayerNames.length).toBeGreaterThan(0);
            expect(entry.icon).toBe('Check');
        });
    });

    describe('createBoatEmbarkEntry', () => {
        it('should create boat embark entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createBoatEmbarkEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(entry.type).toBe(GameLogEntryType.BoatEmbark);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain('embarqué');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Anchor');
        });
    });

    describe('createBoatDisembarkEntry', () => {
        it('should create boat disembark entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createBoatDisembarkEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(entry.type).toBe(GameLogEntryType.BoatDisembark);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain('débarqué');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Anchor');
        });
    });

    describe('createSanctuaryUseEntry', () => {
        it('should create sanctuary use entry for HEAL with addedHealth', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const params = {
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                kind: PlaceableKind.HEAL,
                x: MOCK_X,
                y: MOCK_Y,
                addedHealth: MOCK_ADDED_HEALTH,
            };

            const entry = service.createSanctuaryUseEntry(params);

            expect(entry.type).toBe(GameLogEntryType.SanctuaryUse);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain('soin');
            expect(entry.message).toContain(`+${MOCK_ADDED_HEALTH} santé`);
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Heart');
        });

        it('should create sanctuary use entry for FIGHT with addedDefense', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const params = {
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                kind: PlaceableKind.FIGHT,
                x: MOCK_X,
                y: MOCK_Y,
                addedDefense: MOCK_ADDED_DEFENSE,
            };

            const entry = service.createSanctuaryUseEntry(params);

            expect(entry.type).toBe(GameLogEntryType.SanctuaryUse);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain('combat');
            expect(entry.message).toContain(`+${MOCK_ADDED_DEFENSE} attaque/défense`);
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Heart');
        });

        it('should create sanctuary use entry for FIGHT with addedAttack', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const params = {
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                kind: PlaceableKind.FIGHT,
                x: MOCK_X,
                y: MOCK_Y,
                addedAttack: MOCK_ADDED_ATTACK,
            };

            const entry = service.createSanctuaryUseEntry(params);

            expect(entry.type).toBe(GameLogEntryType.SanctuaryUse);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain('combat');
            expect(entry.message).toContain(`+${MOCK_ADDED_ATTACK} attaque/défense`);
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Heart');
        });

        it('should create sanctuary use entry for other cases', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const params = {
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                kind: PlaceableKind.HEAL,
                x: MOCK_X,
                y: MOCK_Y,
            };

            const entry = service.createSanctuaryUseEntry(params);

            expect(entry.type).toBe(GameLogEntryType.SanctuaryUse);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain('sanctuaire');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Heart');
        });
    });

    describe('createTeleportEntry', () => {
        it('should create teleport entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const params = {
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                originX: MOCK_ORIGIN_X,
                originY: MOCK_ORIGIN_Y,
                destinationX: MOCK_DESTINATION_X,
                destinationY: MOCK_DESTINATION_Y,
            };

            const entry = service.createTeleportEntry(params);

            expect(entry.type).toBe(GameLogEntryType.Teleport);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain(`${MOCK_ORIGIN_X}, ${MOCK_ORIGIN_Y}`);
            expect(entry.message).toContain(`${MOCK_DESTINATION_X}, ${MOCK_DESTINATION_Y}`);
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('LocationDot');
        });
    });

    describe('createFlagPickupEntry', () => {
        it('should create flag pickup entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createFlagPickupEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(entry.type).toBe(GameLogEntryType.FlagPickup);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain('récupéré');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1]);
            expect(entry.icon).toBe('Flag');
        });
    });

    describe('createFlagTransferEntry', () => {
        it('should create flag transfer entry', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const entry = service.createFlagTransferEntry(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);

            expect(entry.type).toBe(GameLogEntryType.FlagTransfer);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_1);
            expect(entry.message).toContain(MOCK_PLAYER_NAME_2);
            expect(entry.message).toContain('transféré');
            expect(entry.involvedPlayerIds).toEqual([MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2]);
            expect(entry.involvedPlayerNames).toEqual([MOCK_PLAYER_NAME_1, MOCK_PLAYER_NAME_2]);
            expect(entry.icon).toBe('Flag');
        });
    });
});

