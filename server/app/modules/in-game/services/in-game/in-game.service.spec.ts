import { Game } from '@app/modules/game-store/entities/game.entity';
import { GameStatisticsDto } from '@app/modules/in-game/dto/game-statistics.dto';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { InitializationService } from '@app/modules/in-game/services/initialization/initialization.service';
import { StatisticsService } from '@app/modules/in-game/services/statistics/statistics.service';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession, WaitingRoomSession } from '@common/interfaces/session.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { InGameService } from './in-game.service';

const MOCK_SESSION_ID = 'session-123';
const MOCK_GAME_ID = 'game-123';
const MOCK_CHAT_ID = 'chat-123';
const MOCK_IN_GAME_ID = 'in-game-123';
const MOCK_PLAYER_ID_1 = 'player-1';
const MOCK_PLAYER_ID_2 = 'player-2';
const MOCK_PLAYER_NAME_1 = 'Player 1';
const MOCK_PLAYER_NAME_2 = 'Player 2';
const MOCK_X = 5;
const MOCK_Y = 10;
const MOCK_MAX_PLAYERS = 4;
const MOCK_TEAM_COUNT = 2;
const MOCK_TEAM_NUMBER_1 = 1;
const MOCK_TEAM_NUMBER_2 = 2;
const MOCK_TURN_NUMBER = 1;
const MOCK_BASE_SPEED = 3;
const MOCK_SPEED_BONUS = 0;
const MOCK_TOTAL_DOORS = 5;
const MOCK_TOTAL_SANCTUARIES = 3;
const MOCK_TOTAL_TELEPORT_TILES = 4;
const MOCK_MIN_PLAYERS_FOR_GAME = 2;
const MOCK_POSITION_X = 0;
const MOCK_POSITION_Y = 0;

const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: MOCK_PLAYER_ID_1,
    name: MOCK_PLAYER_NAME_1,
    avatar: Avatar.Avatar1,
    isAdmin: false,
    baseHealth: 100,
    healthBonus: 0,
    health: 100,
    maxHealth: 100,
    baseSpeed: MOCK_BASE_SPEED,
    speedBonus: MOCK_SPEED_BONUS,
    speed: MOCK_BASE_SPEED,
    boatSpeedBonus: 0,
    boatSpeed: 0,
    baseAttack: 10,
    attackBonus: 0,
    baseDefense: 5,
    defenseBonus: 0,
    attackDice: Dice.D6,
    defenseDice: Dice.D4,
    x: MOCK_POSITION_X,
    y: MOCK_POSITION_Y,
    isInGame: false,
    startPointId: '',
    actionsRemaining: 1,
    combatCount: 0,
    combatWins: 0,
    combatLosses: 0,
    combatDraws: 0,
    hasCombatBonus: false,
    teamNumber: undefined,
    ...overrides,
});

const createMockGame = (overrides: Partial<Game> = {}): Game => {
    const mockObjectId = new Types.ObjectId();
    Object.defineProperty(mockObjectId, 'toString', {
        value: jest.fn().mockReturnValue(MOCK_GAME_ID),
        writable: true,
    });
    return {
        _id: mockObjectId,
        name: 'Test Game',
        description: 'Test Description',
        size: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        visibility: true,
        lastModified: new Date(),
        createdAt: new Date(),
        gridPreviewUrl: '',
        tiles: Array(MOCK_TOTAL_DOORS).fill(null).map(() => ({ kind: TileKind.DOOR, x: 0, y: 0, open: false })),
        objects: Array(MOCK_TOTAL_SANCTUARIES).fill(null).map(() => ({ kind: PlaceableKind.HEAL, x: 0, y: 0, placed: true })),
        draft: false,
        teleportChannels: [
            { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } },
            { channelNumber: 2, tiles: { entryA: { x: 2, y: 2 }, entryB: { x: 3, y: 3 } } },
        ],
        ...overrides,
    };
};

const createMockWaitingRoomSession = (overrides: Partial<WaitingRoomSession> = {}): WaitingRoomSession => ({
    id: MOCK_SESSION_ID,
    gameId: MOCK_GAME_ID,
    maxPlayers: MOCK_MAX_PLAYERS,
    mode: GameMode.CLASSIC,
    chatId: MOCK_CHAT_ID,
    players: [createMockPlayer({ id: MOCK_PLAYER_ID_1 }), createMockPlayer({ id: MOCK_PLAYER_ID_2 })],
    avatarAssignments: [],
    isRoomLocked: false,
    ...overrides,
});

const createMockInGameSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
    id: MOCK_SESSION_ID,
    inGameId: MOCK_IN_GAME_ID,
    gameId: MOCK_GAME_ID,
    maxPlayers: MOCK_MAX_PLAYERS,
    mode: GameMode.CLASSIC,
    chatId: MOCK_CHAT_ID,
    isGameStarted: false,
    inGamePlayers: {
        [MOCK_PLAYER_ID_1]: createMockPlayer({ id: MOCK_PLAYER_ID_1 }),
        [MOCK_PLAYER_ID_2]: createMockPlayer({ id: MOCK_PLAYER_ID_2 }),
    },
    teams: {
        [MOCK_TEAM_NUMBER_1]: { number: MOCK_TEAM_NUMBER_1, playerIds: [MOCK_PLAYER_ID_1] },
    },
    currentTurn: { turnNumber: MOCK_TURN_NUMBER, activePlayerId: MOCK_PLAYER_ID_1, hasUsedAction: false },
    startPoints: [],
    mapSize: MapSize.MEDIUM,
    turnOrder: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2],
    isAdminModeActive: false,
    playerCount: MOCK_MAX_PLAYERS,
    ...overrides,
});

describe('InGameService', () => {
    let service: InGameService;
    let mockTimerService: jest.Mocked<TimerService>;
    let mockInitializationService: jest.Mocked<InitializationService>;
    let mockSessionRepository: jest.Mocked<InGameSessionRepository>;
    let mockGameplayService: jest.Mocked<GameplayService>;
    let mockStatisticsService: jest.Mocked<StatisticsService>;

    beforeEach(async () => {
        mockTimerService = {
            startFirstTurnWithTransition: jest.fn(),
            forceStopTimer: jest.fn(),
            endTurnManual: jest.fn(),
            clearTimerForSession: jest.fn(),
        } as unknown as jest.Mocked<TimerService>;

        mockInitializationService = {
            makeTurnOrder: jest.fn().mockReturnValue([MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2]),
            assignStartPoints: jest.fn(),
        } as unknown as jest.Mocked<InitializationService>;

        mockSessionRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            updatePlayer: jest.fn(),
            assignPlayerToTeam: jest.fn(),
            delete: jest.fn(),
            playerLeave: jest.fn(),
            inGamePlayersCount: jest.fn(),
            realPlayersCount: jest.fn(),
            update: jest.fn(),
            findSessionByPlayerId: jest.fn(),
        } as unknown as jest.Mocked<InGameSessionRepository>;

        mockGameplayService = {
            fetchAndCacheGame: jest.fn(),
            getInitialFlagData: jest.fn(),
            boardBoat: jest.fn(),
            disembarkBoat: jest.fn(),
            endPlayerTurn: jest.fn(),
            toggleDoorAction: jest.fn(),
            sanctuaryRequest: jest.fn(),
            movePlayer: jest.fn(),
            getReachableTiles: jest.fn(),
            getAvailableActions: jest.fn(),
            toggleAdminMode: jest.fn(),
            teleportPlayer: jest.fn(),
            clearSessionResources: jest.fn(),
            performSanctuaryAction: jest.fn(),
            pickUpFlag: jest.fn(),
            requestFlagTransfer: jest.fn(),
            respondToFlagTransfer: jest.fn(),
        } as unknown as jest.Mocked<GameplayService>;

        mockStatisticsService = {
            initializeTracking: jest.fn(),
            trackTileVisited: jest.fn(),
            getStoredGameStatistics: jest.fn(),
            calculateAndStoreGameStatistics: jest.fn(),
        } as unknown as jest.Mocked<StatisticsService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InGameService,
                { provide: TimerService, useValue: mockTimerService },
                { provide: InitializationService, useValue: mockInitializationService },
                { provide: InGameSessionRepository, useValue: mockSessionRepository },
                { provide: GameplayService, useValue: mockGameplayService },
                { provide: StatisticsService, useValue: mockStatisticsService },
            ],
        }).compile();

        service = module.get<InGameService>(InGameService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createInGameSession', () => {
        it('should create in-game session for CLASSIC mode', async () => {
            const waitingSession = createMockWaitingRoomSession({ mode: GameMode.CLASSIC });
            const game = createMockGame();
            mockGameplayService.fetchAndCacheGame.mockResolvedValue(game);
            mockSessionRepository.save.mockImplementation(() => {});

            const result = await service.createInGameSession(waitingSession, GameMode.CLASSIC);

            expect(result.id).toBe(MOCK_SESSION_ID);
            expect(result.mode).toBe(GameMode.CLASSIC);
            expect(result.flagData).toBeUndefined();
            expect(mockGameplayService.fetchAndCacheGame).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_GAME_ID);
            expect(mockStatisticsService.initializeTracking).toHaveBeenCalledWith(
                MOCK_SESSION_ID,
                game.size,
                MOCK_TOTAL_DOORS,
                MOCK_TOTAL_SANCTUARIES,
                MOCK_TOTAL_TELEPORT_TILES,
            );
            expect(mockInitializationService.makeTurnOrder).toHaveBeenCalledWith(waitingSession.players);
            expect(mockInitializationService.assignStartPoints).toHaveBeenCalled();
            expect(mockSessionRepository.save).toHaveBeenCalled();
        });

        it('should create in-game session for CTF mode with teams and flag data', async () => {
            const waitingSession = createMockWaitingRoomSession({ mode: GameMode.CTF });
            const game = createMockGame();
            const flagData = { position: { x: MOCK_X, y: MOCK_Y }, holderPlayerId: null };
            mockGameplayService.fetchAndCacheGame.mockResolvedValue(game);
            mockGameplayService.getInitialFlagData.mockReturnValue(flagData);
            mockSessionRepository.save.mockImplementation(() => {});
            mockSessionRepository.findById.mockReturnValue(createMockInGameSession({ mode: GameMode.CTF }));

            const result = await service.createInGameSession(waitingSession, GameMode.CTF);

            expect(result.mode).toBe(GameMode.CTF);
            expect(result.flagData).toEqual(flagData);
            expect(result.teams[MOCK_TEAM_NUMBER_1]).toBeDefined();
            expect(result.teams[MOCK_TEAM_NUMBER_2]).toBeDefined();
            expect(mockGameplayService.getInitialFlagData).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });

        it('should set first player speed correctly', async () => {
            const waitingSession = createMockWaitingRoomSession();
            const game = createMockGame();
            mockGameplayService.fetchAndCacheGame.mockResolvedValue(game);
            mockSessionRepository.save.mockImplementation(() => {});

            const result = await service.createInGameSession(waitingSession, GameMode.CLASSIC);

            const firstPlayer = result.inGamePlayers[MOCK_PLAYER_ID_1];
            expect(firstPlayer.speed).toBe(MOCK_BASE_SPEED + MOCK_SPEED_BONUS);
        });

        it('should track tile visited for all players', async () => {
            const waitingSession = createMockWaitingRoomSession();
            const game = createMockGame();
            mockGameplayService.fetchAndCacheGame.mockResolvedValue(game);
            mockSessionRepository.save.mockImplementation(() => {});

            await service.createInGameSession(waitingSession, GameMode.CLASSIC);

            expect(mockStatisticsService.trackTileVisited).toHaveBeenCalledTimes(waitingSession.players.length);
        });

        it('should join virtual players automatically', async () => {
            const virtualPlayer = createMockPlayer({ id: MOCK_PLAYER_ID_1, virtualPlayerType: VirtualPlayerType.Offensive });
            const waitingSession = createMockWaitingRoomSession({ players: [virtualPlayer] });
            const game = createMockGame();
            mockGameplayService.fetchAndCacheGame.mockResolvedValue(game);
            mockSessionRepository.save.mockImplementation(() => {});
            mockSessionRepository.findById.mockReturnValue(createMockInGameSession());

            await service.createInGameSession(waitingSession, GameMode.CLASSIC);

            expect(mockSessionRepository.findById).toHaveBeenCalled();
        });
    });

    describe('boardBoat', () => {
        it('should call gameplayService.boardBoat', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.boardBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockGameplayService.boardBoat).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);
        });
    });

    describe('disembarkBoat', () => {
        it('should call gameplayService.disembarkBoat', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.disembarkBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockGameplayService.disembarkBoat).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);
        });
    });

    describe('getSession', () => {
        it('should return session from repository', () => {
            const session = createMockInGameSession();
            mockSessionRepository.findById.mockReturnValue(session);

            const result = service.getSession(MOCK_SESSION_ID);

            expect(result).toBe(session);
            expect(mockSessionRepository.findById).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });

        it('should return undefined when session not found', () => {
            mockSessionRepository.findById.mockReturnValue(undefined);

            const result = service.getSession(MOCK_SESSION_ID);

            expect(result).toBeUndefined();
        });
    });

    describe('joinInGameSession', () => {
        it('should throw NotFoundException when player not found', () => {
            const session = createMockInGameSession();
            mockSessionRepository.findById.mockReturnValue(session);

            expect(() => service.joinInGameSession(MOCK_SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when player already joined', () => {
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, isInGame: true });
            const session = createMockInGameSession({ inGamePlayers: { [MOCK_PLAYER_ID_1]: player } });
            mockSessionRepository.findById.mockReturnValue(session);

            expect(() => service.joinInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1)).toThrow(BadRequestException);
        });

        it('should update player to joined and assign to team in CTF mode', () => {
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, isInGame: false });
            const session = createMockInGameSession({ mode: GameMode.CTF, inGamePlayers: { [MOCK_PLAYER_ID_1]: player } });
            mockSessionRepository.findById.mockReturnValue(session);
            mockSessionRepository.updatePlayer.mockImplementation(() => {});

            service.joinInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockSessionRepository.updatePlayer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, { isInGame: true });
            expect(mockSessionRepository.assignPlayerToTeam).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
        });

        it('should start session when all players joined', () => {
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, isInGame: false });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, isInGame: true });
            const session = createMockInGameSession({
                isGameStarted: false,
                inGamePlayers: { [MOCK_PLAYER_ID_1]: player1, [MOCK_PLAYER_ID_2]: player2 },
            });
            const updatedSession = createMockInGameSession({
                isGameStarted: false,
                inGamePlayers: { [MOCK_PLAYER_ID_1]: { ...player1, isInGame: true }, [MOCK_PLAYER_ID_2]: player2 },
            });
            mockSessionRepository.findById.mockReturnValueOnce(session).mockReturnValueOnce(updatedSession).mockReturnValueOnce(updatedSession);
            mockSessionRepository.updatePlayer.mockImplementation(() => {});
            mockTimerService.startFirstTurnWithTransition.mockReturnValue(updatedSession.currentTurn);

            service.joinInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockTimerService.startFirstTurnWithTransition).toHaveBeenCalledWith(updatedSession, DEFAULT_TURN_DURATION);
        });

        it('should not start session when not all players joined', () => {
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, isInGame: false });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, isInGame: false });
            const session = createMockInGameSession({
                isGameStarted: false,
                inGamePlayers: { [MOCK_PLAYER_ID_1]: player1, [MOCK_PLAYER_ID_2]: player2 },
            });
            const updatedSession = createMockInGameSession({
                isGameStarted: false,
                inGamePlayers: { [MOCK_PLAYER_ID_1]: { ...player1, isInGame: true }, [MOCK_PLAYER_ID_2]: player2 },
            });
            mockSessionRepository.findById.mockReturnValueOnce(session).mockReturnValueOnce(updatedSession).mockReturnValueOnce(updatedSession);
            mockSessionRepository.updatePlayer.mockImplementation(() => {});

            service.joinInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockTimerService.startFirstTurnWithTransition).not.toHaveBeenCalled();
        });

        it('should not start session when game already started', () => {
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, isInGame: false });
            const session = createMockInGameSession({ isGameStarted: true, inGamePlayers: { [MOCK_PLAYER_ID_1]: player } });
            const updatedSession = createMockInGameSession({ isGameStarted: true, inGamePlayers: { [MOCK_PLAYER_ID_1]: { ...player, isInGame: true } } });
            mockSessionRepository.findById.mockReturnValueOnce(session).mockReturnValueOnce(updatedSession).mockReturnValueOnce(updatedSession);
            mockSessionRepository.updatePlayer.mockImplementation(() => {});

            service.joinInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockTimerService.startFirstTurnWithTransition).not.toHaveBeenCalled();
        });
    });

    describe('endPlayerTurn', () => {
        it('should call gameplayService.endPlayerTurn', () => {
            const session = createMockInGameSession();
            mockGameplayService.endPlayerTurn.mockReturnValue(session);

            const result = service.endPlayerTurn(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(result).toBe(session);
            expect(mockGameplayService.endPlayerTurn).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
        });
    });

    describe('toggleDoorAction', () => {
        it('should call gameplayService.toggleDoorAction', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.toggleDoorAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockGameplayService.toggleDoorAction).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);
        });
    });

    describe('sanctuaryRequest', () => {
        it('should call gameplayService.sanctuaryRequest', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.sanctuaryRequest(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, PlaceableKind.HEAL);

            expect(mockGameplayService.sanctuaryRequest).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, PlaceableKind.HEAL);
        });
    });

    describe('movePlayer', () => {
        it('should call gameplayService.movePlayer', () => {
            service.movePlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, Orientation.N);

            expect(mockGameplayService.movePlayer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, Orientation.N);
        });
    });

    describe('leaveInGameSession', () => {
        it('should deactivate admin mode when admin leaves and admin mode is active', () => {
            const adminPlayer = createMockPlayer({ id: MOCK_PLAYER_ID_1, isAdmin: true });
            const session = createMockInGameSession({ isAdminModeActive: true, inGamePlayers: { [MOCK_PLAYER_ID_1]: adminPlayer } });
            mockSessionRepository.playerLeave.mockReturnValue(adminPlayer);
            mockSessionRepository.findById.mockReturnValue(session);
            mockSessionRepository.inGamePlayersCount.mockReturnValue(MOCK_MIN_PLAYERS_FOR_GAME);
            mockSessionRepository.realPlayersCount.mockReturnValue(MOCK_MIN_PLAYERS_FOR_GAME);

            const result = service.leaveInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(result.adminModeDeactivated).toBe(true);
            expect(mockSessionRepository.update).toHaveBeenCalled();
        });

        it('should not deactivate admin mode when non-admin leaves', () => {
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, isAdmin: false });
            const session = createMockInGameSession({ isAdminModeActive: true, inGamePlayers: { [MOCK_PLAYER_ID_1]: player } });
            mockSessionRepository.playerLeave.mockReturnValue(player);
            mockSessionRepository.findById.mockReturnValue(session);
            mockSessionRepository.inGamePlayersCount.mockReturnValue(MOCK_MIN_PLAYERS_FOR_GAME);
            mockSessionRepository.realPlayersCount.mockReturnValue(MOCK_MIN_PLAYERS_FOR_GAME);

            const result = service.leaveInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(result.adminModeDeactivated).toBe(false);
            expect(mockSessionRepository.update).not.toHaveBeenCalled();
        });

        it('should end session when in-game players count is less than 2', () => {
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1 });
            const session = createMockInGameSession({ inGamePlayers: { [MOCK_PLAYER_ID_1]: player } });
            mockSessionRepository.playerLeave.mockReturnValue(player);
            mockSessionRepository.findById.mockReturnValue(session);
            mockSessionRepository.inGamePlayersCount.mockReturnValue(1);
            mockSessionRepository.realPlayersCount.mockReturnValue(1);

            const result = service.leaveInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(result.sessionEnded).toBe(true);
            expect(mockTimerService.forceStopTimer).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });

        it('should end session when no real players remain', () => {
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1 });
            const session = createMockInGameSession({ inGamePlayers: { [MOCK_PLAYER_ID_1]: player } });
            mockSessionRepository.playerLeave.mockReturnValue(player);
            mockSessionRepository.findById.mockReturnValue(session);
            mockSessionRepository.inGamePlayersCount.mockReturnValue(MOCK_MIN_PLAYERS_FOR_GAME);
            mockSessionRepository.realPlayersCount.mockReturnValue(0);

            const result = service.leaveInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(result.sessionEnded).toBe(true);
            expect(mockTimerService.forceStopTimer).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });

        it('should end turn when leaving player is active player', () => {
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1 });
            const session = createMockInGameSession({
                currentTurn: { turnNumber: MOCK_TURN_NUMBER, activePlayerId: MOCK_PLAYER_ID_1, hasUsedAction: false },
                inGamePlayers: { [MOCK_PLAYER_ID_1]: player },
            });
            mockSessionRepository.playerLeave.mockReturnValue(player);
            mockSessionRepository.findById.mockReturnValue(session);
            mockSessionRepository.inGamePlayersCount.mockReturnValue(MOCK_MIN_PLAYERS_FOR_GAME);
            mockSessionRepository.realPlayersCount.mockReturnValue(MOCK_MIN_PLAYERS_FOR_GAME);

            service.leaveInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockTimerService.endTurnManual).toHaveBeenCalledWith(session);
        });

        it('should return correct player information', () => {
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, name: MOCK_PLAYER_NAME_1 });
            const session = createMockInGameSession({ inGamePlayers: { [MOCK_PLAYER_ID_1]: player } });
            mockSessionRepository.playerLeave.mockReturnValue(player);
            mockSessionRepository.findById.mockReturnValue(session);
            mockSessionRepository.inGamePlayersCount.mockReturnValue(MOCK_MIN_PLAYERS_FOR_GAME);
            mockSessionRepository.realPlayersCount.mockReturnValue(MOCK_MIN_PLAYERS_FOR_GAME);

            const result = service.leaveInGameSession(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(result.playerId).toBe(MOCK_PLAYER_ID_1);
            expect(result.playerName).toBe(MOCK_PLAYER_NAME_1);
            expect(result.session).toBe(session);
        });
    });

    describe('findSessionByPlayerId', () => {
        it('should return session from repository', () => {
            const session = createMockInGameSession();
            mockSessionRepository.findSessionByPlayerId.mockReturnValue(session);

            const result = service.findSessionByPlayerId(MOCK_PLAYER_ID_1);

            expect(result).toBe(session);
            expect(mockSessionRepository.findSessionByPlayerId).toHaveBeenCalledWith(MOCK_PLAYER_ID_1);
        });

        it('should return null when session not found', () => {
            mockSessionRepository.findSessionByPlayerId.mockReturnValue(null);

            const result = service.findSessionByPlayerId(MOCK_PLAYER_ID_1);

            expect(result).toBeNull();
        });
    });

    describe('getReachableTiles', () => {
        it('should call gameplayService.getReachableTiles', () => {
            service.getReachableTiles(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockGameplayService.getReachableTiles).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
        });
    });

    describe('getAvailableActions', () => {
        it('should call gameplayService.getAvailableActions', () => {
            mockGameplayService.getAvailableActions.mockImplementation(() => {});

            service.getAvailableActions(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockGameplayService.getAvailableActions).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
        });
    });

    describe('toggleAdminMode', () => {
        it('should return result from gameplayService.toggleAdminMode', () => {
            const session = createMockInGameSession();
            mockGameplayService.toggleAdminMode.mockReturnValue(session);

            const result = service.toggleAdminMode(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(result).toBe(session);
            expect(mockGameplayService.toggleAdminMode).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
        });
    });

    describe('teleportPlayer', () => {
        it('should call gameplayService.teleportPlayer', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockGameplayService.teleportPlayer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);
        });
    });

    describe('removeSession', () => {
        it('should delete session and clear resources', () => {
            service.removeSession(MOCK_SESSION_ID);

            expect(mockSessionRepository.delete).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockGameplayService.clearSessionResources).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockTimerService.clearTimerForSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });
    });

    describe('performSanctuaryAction', () => {
        it('should call gameplayService.performSanctuaryAction with default double false', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.performSanctuaryAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockGameplayService.performSanctuaryAction).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, false);
        });

        it('should call gameplayService.performSanctuaryAction with double true', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.performSanctuaryAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, true);

            expect(mockGameplayService.performSanctuaryAction).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, true);
        });
    });

    describe('getGameStatistics', () => {
        it('should return statistics from statisticsService', () => {
            const expectedStats: GameStatisticsDto = {
                winnerId: MOCK_PLAYER_ID_1,
                winnerName: MOCK_PLAYER_NAME_1,
                playersStatistics: [],
                globalStatistics: {
                    gameDuration: '0:00',
                    totalTurns: MOCK_TURN_NUMBER,
                    tilesVisitedPercentage: 0,
                    totalTeleportations: 0,
                    doorsManipulatedPercentage: 0,
                    sanctuariesUsedPercentage: 0,
                    flagHoldersCount: 0,
                },
            };
            mockStatisticsService.getStoredGameStatistics.mockReturnValue(expectedStats);

            const result = service.getGameStatistics(MOCK_SESSION_ID);

            expect(result).toBe(expectedStats);
            expect(mockStatisticsService.getStoredGameStatistics).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });
    });

    describe('storeGameStatistics', () => {
        it('should calculate and store statistics with gameStartTime', () => {
            const gameStartTime = new Date();
            const session = createMockInGameSession({ gameStartTime });
            mockSessionRepository.findById.mockReturnValue(session);

            service.storeGameStatistics(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_NAME_1);

            expect(mockStatisticsService.calculateAndStoreGameStatistics).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, MOCK_PLAYER_NAME_1, gameStartTime);
        });

        it('should use current date when gameStartTime is undefined', () => {
            const session = createMockInGameSession();
            mockSessionRepository.findById.mockReturnValue(session);
            const beforeCall = new Date();

            service.storeGameStatistics(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_NAME_1);

            const afterCall = new Date();
            expect(mockStatisticsService.calculateAndStoreGameStatistics).toHaveBeenCalled();
            const callArgs = mockStatisticsService.calculateAndStoreGameStatistics.mock.calls[0];
            const gameStartTime = callArgs[3] as Date;
            expect(gameStartTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
            expect(gameStartTime.getTime()).toBeLessThanOrEqual(afterCall.getTime());
        });
    });

    describe('pickUpFlag', () => {
        it('should call gameplayService.pickUpFlag', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.pickUpFlag(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockGameplayService.pickUpFlag).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);
        });
    });

    describe('requestFlagTransfer', () => {
        it('should call gameplayService.requestFlagTransfer', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.requestFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockGameplayService.requestFlagTransfer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);
        });
    });

    describe('respondToFlagTransfer', () => {
        it('should call gameplayService.respondToFlagTransfer', () => {
            service.respondToFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, true);

            expect(mockGameplayService.respondToFlagTransfer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, true);
        });
    });
});
