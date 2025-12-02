/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { GameLogService } from '@app/modules/game-log/services/game-log.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameLogEntryType } from '@common/enums/game-log-entry-type.enum';
import { GameLogEvents } from '@common/enums/game-log-events.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { generateGameLogId } from '@common/utils/game-log.util';
import { Test, TestingModule } from '@nestjs/testing';
import 'reflect-metadata';
import { Server } from 'socket.io';
import { GameLogGateway } from './game-log.gateway';

jest.mock('@common/utils/game-log.util');

const MOCK_SESSION_ID = 'session-123';
const MOCK_CHAT_ID = 'chat-123';
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
const MOCK_ORIGIN_X = 1;
const MOCK_ORIGIN_Y = 2;
const MOCK_DESTINATION_X = 3;
const MOCK_DESTINATION_Y = 4;
const MOCK_BOAT_ID = 'boat-123';
const MOCK_TIMESTAMP = '2024-01-01T00:00:00.000Z';
const MOCK_LOG_ID = 'log-123';
const MOCK_DATE_NOW = 1234567890;

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
    chatId: MOCK_CHAT_ID,
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

const createMockLogEntry = () => ({
    type: GameLogEntryType.TurnStart,
    message: 'Test message',
    involvedPlayerIds: [MOCK_PLAYER_ID_1],
    involvedPlayerNames: [MOCK_PLAYER_NAME_1],
    icon: 'HourglassStart',
});

describe('GameLogGateway', () => {
    let gateway: GameLogGateway;
    let mockGameLogService: jest.Mocked<GameLogService>;
    let mockRepository: jest.Mocked<InGameSessionRepository>;
    let mockInGameService: jest.Mocked<InGameService>;
    let mockServer: jest.Mocked<Server>;

    const createMockServer = (): jest.Mocked<Server> => {
        const mockBroadcastOperator = {
            emit: jest.fn(),
        };
        return {
            to: jest.fn().mockReturnValue(mockBroadcastOperator),
            emit: jest.fn(),
        } as unknown as jest.Mocked<Server>;
    };

    beforeEach(async () => {
        mockServer = createMockServer();

        const mockGameLogServiceValue = {
            createTurnStartEntry: jest.fn(),
            createCombatStartEntry: jest.fn(),
            createCombatEndEntry: jest.fn(),
            createCombatResultEntry: jest.fn(),
            createDoorToggleEntry: jest.fn(),
            createDebugModeToggleEntry: jest.fn(),
            createPlayerAbandonEntry: jest.fn(),
            createGameOverEntry: jest.fn(),
            createBoatEmbarkEntry: jest.fn(),
            createBoatDisembarkEntry: jest.fn(),
            createSanctuaryUseEntry: jest.fn(),
            createTeleportEntry: jest.fn(),
            createFlagPickupEntry: jest.fn(),
            createFlagTransferEntry: jest.fn(),
        };

        const mockRepositoryValue = {
            findById: jest.fn(),
        };

        const mockInGameServiceValue = {
            removeSession: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameLogGateway,
                {
                    provide: GameLogService,
                    useValue: mockGameLogServiceValue,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockRepositoryValue,
                },
                {
                    provide: InGameService,
                    useValue: mockInGameServiceValue,
                },
            ],
        }).compile();

        gateway = module.get<GameLogGateway>(GameLogGateway);
        mockGameLogService = module.get(GameLogService);
        mockRepository = module.get(InGameSessionRepository);
        mockInGameService = module.get(InGameService);

        (gateway as unknown as { server: jest.Mocked<Server> }).server = mockServer;

        jest.spyOn(Date, 'now').mockReturnValue(MOCK_DATE_NOW);
        jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(MOCK_TIMESTAMP);
        (generateGameLogId as jest.Mock).mockReturnValue(MOCK_LOG_ID);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleTurnStarted', () => {
        it('should handle turn started event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockGameLogService.createTurnStartEntry.mockReturnValue(entry);

            gateway.handleTurnStarted({ session });

            expect(mockGameLogService.createTurnStartEntry).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
            expect(mockServer.to(MOCK_CHAT_ID).emit).toHaveBeenCalledWith(
                GameLogEvents.LogEntry,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        id: MOCK_LOG_ID,
                        timestamp: MOCK_TIMESTAMP,
                        ...entry,
                    }),
                }),
            );
        });
    });

    describe('handleCombatStarted', () => {
        it('should handle combat started event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockRepository.findById.mockReturnValue(session);
            mockGameLogService.createCombatStartEntry.mockReturnValue(entry);

            gateway.handleCombatStarted({
                sessionId: MOCK_SESSION_ID,
                attackerId: MOCK_PLAYER_ID_1,
                targetId: MOCK_PLAYER_ID_2,
            });

            expect(mockRepository.findById).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockGameLogService.createCombatStartEntry).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });

        it('should not handle combat started event if session not found', () => {
            mockRepository.findById.mockReturnValue(null as unknown as InGameSession);

            gateway.handleCombatStarted({
                sessionId: MOCK_SESSION_ID,
                attackerId: MOCK_PLAYER_ID_1,
                targetId: MOCK_PLAYER_ID_2,
            });

            expect(mockGameLogService.createCombatStartEntry).not.toHaveBeenCalled();
        });
    });

    describe('handleCombatVictory', () => {
        it('should handle combat victory event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockRepository.findById.mockReturnValue(session);
            mockGameLogService.createCombatEndEntry.mockReturnValue(entry);

            gateway.handleCombatVictory({
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                winnerId: MOCK_PLAYER_ID_1,
            });

            expect(mockRepository.findById).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockGameLogService.createCombatEndEntry).toHaveBeenCalledWith(
                MOCK_SESSION_ID,
                MOCK_PLAYER_ID_1,
                MOCK_PLAYER_ID_2,
                MOCK_PLAYER_ID_1,
            );
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });

        it('should not handle combat victory event if session not found', () => {
            mockRepository.findById.mockReturnValue(null as unknown as InGameSession);

            gateway.handleCombatVictory({
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                winnerId: MOCK_PLAYER_ID_1,
            });

            expect(mockGameLogService.createCombatEndEntry).not.toHaveBeenCalled();
        });
    });

    describe('handlePlayerCombatResult', () => {
        it('should handle player combat result event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockRepository.findById.mockReturnValue(session);
            mockGameLogService.createCombatResultEntry.mockReturnValue(entry as never);

            gateway.handlePlayerCombatResult({
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAAttack: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseAttack: MOCK_BASE_ATTACK,
                    attackBonus: MOCK_ATTACK_BONUS,
                    totalAttack: MOCK_TOTAL_ATTACK,
                },
                playerBAttack: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseAttack: MOCK_BASE_ATTACK,
                    attackBonus: MOCK_ATTACK_BONUS,
                    totalAttack: MOCK_TOTAL_ATTACK,
                },
                playerADefense: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseDefense: MOCK_BASE_DEFENSE,
                    defenseBonus: MOCK_DEFENSE_BONUS,
                    totalDefense: MOCK_TOTAL_DEFENSE,
                },
                playerBDefense: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseDefense: MOCK_BASE_DEFENSE,
                    defenseBonus: MOCK_DEFENSE_BONUS,
                    totalDefense: MOCK_TOTAL_DEFENSE,
                },
                playerADamage: MOCK_DAMAGE,
                playerBDamage: MOCK_DAMAGE,
            });

            expect(mockRepository.findById).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockGameLogService.createCombatResultEntry).toHaveBeenCalled();
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });

        it('should not handle player combat result event if session not found', () => {
            mockRepository.findById.mockReturnValue(null as unknown as InGameSession);

            gateway.handlePlayerCombatResult({
                sessionId: MOCK_SESSION_ID,
                playerAId: MOCK_PLAYER_ID_1,
                playerBId: MOCK_PLAYER_ID_2,
                playerAAttack: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseAttack: MOCK_BASE_ATTACK,
                    attackBonus: MOCK_ATTACK_BONUS,
                    totalAttack: MOCK_TOTAL_ATTACK,
                },
                playerBAttack: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseAttack: MOCK_BASE_ATTACK,
                    attackBonus: MOCK_ATTACK_BONUS,
                    totalAttack: MOCK_TOTAL_ATTACK,
                },
                playerADefense: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseDefense: MOCK_BASE_DEFENSE,
                    defenseBonus: MOCK_DEFENSE_BONUS,
                    totalDefense: MOCK_TOTAL_DEFENSE,
                },
                playerBDefense: {
                    diceRoll: MOCK_DICE_ROLL,
                    baseDefense: MOCK_BASE_DEFENSE,
                    defenseBonus: MOCK_DEFENSE_BONUS,
                    totalDefense: MOCK_TOTAL_DEFENSE,
                },
                playerADamage: MOCK_DAMAGE,
                playerBDamage: MOCK_DAMAGE,
            });

            expect(mockGameLogService.createCombatResultEntry).not.toHaveBeenCalled();
        });
    });

    describe('handleDoorToggled', () => {
        it('should handle door toggled event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockGameLogService.createDoorToggleEntry.mockReturnValue(entry);

            gateway.handleDoorToggled({
                session,
                playerId: MOCK_PLAYER_ID_1,
                x: MOCK_X,
                y: MOCK_Y,
                isOpen: true,
            });

            expect(mockGameLogService.createDoorToggleEntry).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_X, MOCK_Y, true);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });
    });

    describe('handleAdminModeToggled', () => {
        it('should handle admin mode toggled event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockRepository.findById.mockReturnValue(session);
            mockGameLogService.createDebugModeToggleEntry.mockReturnValue(entry);

            gateway.handleAdminModeToggled({
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                isAdminModeActive: true,
            });

            expect(mockRepository.findById).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockGameLogService.createDebugModeToggleEntry).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, true);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });

        it('should not handle admin mode toggled event if session not found', () => {
            mockRepository.findById.mockReturnValue(null as unknown as InGameSession);

            gateway.handleAdminModeToggled({
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                isAdminModeActive: true,
            });

            expect(mockGameLogService.createDebugModeToggleEntry).not.toHaveBeenCalled();
        });
    });

    describe('handlePlayerAbandon', () => {
        it('should handle player abandon event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockRepository.findById.mockReturnValue(session);
            mockGameLogService.createPlayerAbandonEntry.mockReturnValue(entry);

            gateway.handlePlayerAbandon({
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                playerName: MOCK_PLAYER_NAME_1,
            });

            expect(mockRepository.findById).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockGameLogService.createPlayerAbandonEntry).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });

        it('should not handle player abandon event if session not found', () => {
            mockRepository.findById.mockReturnValue(null as unknown as InGameSession);

            gateway.handlePlayerAbandon({
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                playerName: MOCK_PLAYER_NAME_1,
            });

            expect(mockGameLogService.createPlayerAbandonEntry).not.toHaveBeenCalled();
        });
    });

    describe('handleGameOver', () => {
        it('should handle game over event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockRepository.findById.mockReturnValue(session);
            mockGameLogService.createGameOverEntry.mockReturnValue(entry);

            gateway.handleGameOver({
                sessionId: MOCK_SESSION_ID,
                winnerId: MOCK_PLAYER_ID_1,
                winnerName: MOCK_PLAYER_NAME_1,
            });

            expect(mockRepository.findById).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockGameLogService.createGameOverEntry).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
            expect(mockInGameService.removeSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });

        it('should not handle game over event if session not found', () => {
            mockRepository.findById.mockReturnValue(null as unknown as InGameSession);

            gateway.handleGameOver({
                sessionId: MOCK_SESSION_ID,
                winnerId: MOCK_PLAYER_ID_1,
                winnerName: MOCK_PLAYER_NAME_1,
            });

            expect(mockGameLogService.createGameOverEntry).not.toHaveBeenCalled();
            expect(mockInGameService.removeSession).not.toHaveBeenCalled();
        });
    });

    describe('handlePlayerBoardedBoat', () => {
        it('should handle player boarded boat event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockGameLogService.createBoatEmbarkEntry.mockReturnValue(entry);

            gateway.handlePlayerBoardedBoat({
                session,
                playerId: MOCK_PLAYER_ID_1,
                boatId: MOCK_BOAT_ID,
            });

            expect(mockGameLogService.createBoatEmbarkEntry).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });
    });

    describe('handlePlayerDisembarkedBoat', () => {
        it('should handle player disembarked boat event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockGameLogService.createBoatDisembarkEntry.mockReturnValue(entry);

            gateway.handlePlayerDisembarkedBoat({
                session,
                playerId: MOCK_PLAYER_ID_1,
            });

            expect(mockGameLogService.createBoatDisembarkEntry).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });
    });

    describe('handleSanctuaryActionSuccess', () => {
        it('should handle sanctuary action success event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockGameLogService.createSanctuaryUseEntry.mockReturnValue(entry);

            gateway.handleSanctuaryActionSuccess({
                session,
                playerId: MOCK_PLAYER_ID_1,
                kind: PlaceableKind.HEAL,
                x: MOCK_X,
                y: MOCK_Y,
                addedHealth: MOCK_ADDED_HEALTH,
            });

            expect(mockGameLogService.createSanctuaryUseEntry).toHaveBeenCalledWith({
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                kind: PlaceableKind.HEAL,
                x: MOCK_X,
                y: MOCK_Y,
                addedHealth: MOCK_ADDED_HEALTH,
            });
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });
    });

    describe('handlePlayerTeleported', () => {
        it('should handle player teleported event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockGameLogService.createTeleportEntry.mockReturnValue(entry);

            gateway.handlePlayerTeleported({
                session,
                playerId: MOCK_PLAYER_ID_1,
                originX: MOCK_ORIGIN_X,
                originY: MOCK_ORIGIN_Y,
                destinationX: MOCK_DESTINATION_X,
                destinationY: MOCK_DESTINATION_Y,
            });

            expect(mockGameLogService.createTeleportEntry).toHaveBeenCalledWith({
                sessionId: MOCK_SESSION_ID,
                playerId: MOCK_PLAYER_ID_1,
                originX: MOCK_ORIGIN_X,
                originY: MOCK_ORIGIN_Y,
                destinationX: MOCK_DESTINATION_X,
                destinationY: MOCK_DESTINATION_Y,
            });
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });
    });

    describe('handleFlagPickedUp', () => {
        it('should handle flag picked up event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockGameLogService.createFlagPickupEntry.mockReturnValue(entry);

            gateway.handleFlagPickedUp({
                session,
                playerId: MOCK_PLAYER_ID_1,
            });

            expect(mockGameLogService.createFlagPickupEntry).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });
    });

    describe('handleFlagTransferred', () => {
        it('should handle flag transferred event', () => {
            const session = createMockSession();
            const entry = createMockLogEntry();
            mockGameLogService.createFlagTransferEntry.mockReturnValue(entry);

            gateway.handleFlagTransferred({
                session,
                fromPlayerId: MOCK_PLAYER_ID_1,
                toPlayerId: MOCK_PLAYER_ID_2,
            });

            expect(mockGameLogService.createFlagTransferEntry).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_CHAT_ID);
        });
    });
});

