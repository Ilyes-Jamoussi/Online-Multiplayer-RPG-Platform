import { GameplayService } from './gameplay.service';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { TrackingService } from '@app/modules/in-game/services/tracking/tracking.service';
import { ServerEvents } from '@app/enums/server-events.enum';
import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { FlagData } from '@common/interfaces/flag-data.interface';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { StartPoint } from '@common/interfaces/start-point.interface';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

const MOCK_SESSION_ID = 'session-123';
const MOCK_PLAYER_ID_1 = 'player-1';
const MOCK_PLAYER_ID_2 = 'player-2';
const MOCK_PLAYER_NAME_1 = 'Player 1';
const MOCK_PLAYER_NAME_2 = 'Player 2';
const MOCK_X = 5;
const MOCK_Y = 10;
const MOCK_X_2 = 6;
const MOCK_Y_2 = 11;
const MOCK_START_POINT_ID = 'start-point-123';
const MOCK_SPEED = 3;
const MOCK_ACTIONS_REMAINING = 1;
const MOCK_BOAT_ID = 'boat-123';
const MOCK_PLACEABLE_ID = 'placeable-123';

const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: MOCK_PLAYER_ID_1,
    name: MOCK_PLAYER_NAME_1,
    avatar: Avatar.Avatar1,
    isAdmin: false,
    baseHealth: 100,
    healthBonus: 0,
    health: 100,
    maxHealth: 100,
    baseSpeed: MOCK_SPEED,
    speedBonus: 0,
    speed: MOCK_SPEED,
    boatSpeedBonus: 0,
    boatSpeed: 0,
    baseAttack: 10,
    attackBonus: 0,
    baseDefense: 5,
    defenseBonus: 0,
    attackDice: Dice.D6,
    defenseDice: Dice.D4,
    x: MOCK_X,
    y: MOCK_Y,
    isInGame: true,
    startPointId: MOCK_START_POINT_ID,
    actionsRemaining: MOCK_ACTIONS_REMAINING,
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
        1: { number: 1, playerIds: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2] },
    },
    currentTurn: { turnNumber: 1, activePlayerId: MOCK_PLAYER_ID_1, hasUsedAction: false },
    startPoints: [],
    mapSize: MapSize.MEDIUM,
    turnOrder: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2],
    playerCount: 2,
    ...overrides,
});

const createMockTile = (overrides: Partial<Tile> = {}): Tile => ({
    kind: TileKind.BASE,
    x: MOCK_X,
    y: MOCK_Y,
    ...overrides,
});

const createMockPlaceable = (overrides: Partial<Placeable> = {}): Placeable => ({
    _id: { toString: jest.fn().mockReturnValue(MOCK_PLACEABLE_ID) } as unknown as Types.ObjectId,
    kind: PlaceableKind.START,
    x: MOCK_X,
    y: MOCK_Y,
    placed: true,
    ...overrides,
});

const createMockStartPoint = (overrides: Partial<StartPoint> = {}): StartPoint => ({
    id: MOCK_START_POINT_ID,
    x: MOCK_X,
    y: MOCK_Y,
    playerId: MOCK_PLAYER_ID_1,
    ...overrides,
});

describe('GameplayService', () => {
    let service: GameplayService;
    let mockRepository: jest.Mocked<InGameSessionRepository>;
    let mockActionService: jest.Mocked<ActionService>;
    let mockTimerService: jest.Mocked<TimerService>;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;
    let mockTrackingService: jest.Mocked<TrackingService>;

    beforeEach(async () => {
        const mockRepositoryValue = {
            findById: jest.fn(),
            update: jest.fn(),
            movePlayerPosition: jest.fn(),
            playerHasFlag: jest.fn(),
            updateFlagPosition: jest.fn(),
            pickUpFlag: jest.fn(),
            findStartPointById: jest.fn(),
            isVirtualPlayer: jest.fn(),
        };

        const mockActionServiceValue = {
            toggleDoor: jest.fn(),
            calculateReachableTiles: jest.fn(),
            pickUpFlag: jest.fn(),
            requestFlagTransfer: jest.fn(),
            respondToFlagTransfer: jest.fn(),
            sanctuaryRequest: jest.fn(),
            performSanctuaryAction: jest.fn(),
            movePlayer: jest.fn(),
            calculateAvailableActions: jest.fn(),
            isTileFree: jest.fn(),
            getTileAtPosition: jest.fn(),
            getTeleportDestination: jest.fn(),
            getTileOccupant: jest.fn(),
            getPlaceableAtPosition: jest.fn(),
            fetchAndCacheGame: jest.fn(),
            getInitialFlagData: jest.fn(),
            clearSessionGameCache: jest.fn(),
            clearActiveCombatForSession: jest.fn(),
            boardBoat: jest.fn(),
            disembarkBoat: jest.fn(),
            selectCombatPosture: jest.fn(),
            getActiveCombat: jest.fn(),
        };

        const mockTimerServiceValue = {
            endTurnManual: jest.fn(),
            getGameTimerState: jest.fn(),
        };

        const mockEventEmitterValue = {
            emit: jest.fn(),
        };

        const mockTrackingServiceValue = {
            trackDoorToggled: jest.fn(),
            trackSanctuaryUsed: jest.fn(),
            trackTileVisited: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameplayService,
                {
                    provide: InGameSessionRepository,
                    useValue: mockRepositoryValue,
                },
                {
                    provide: ActionService,
                    useValue: mockActionServiceValue,
                },
                {
                    provide: TimerService,
                    useValue: mockTimerServiceValue,
                },
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitterValue,
                },
                {
                    provide: TrackingService,
                    useValue: mockTrackingServiceValue,
                },
            ],
        }).compile();

        service = module.get<GameplayService>(GameplayService);
        mockRepository = module.get(InGameSessionRepository);
        mockActionService = module.get(ActionService);
        mockTimerService = module.get(TimerService);
        mockEventEmitter = module.get(EventEmitter2);
        mockTrackingService = module.get(TrackingService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('endPlayerTurn', () => {
        it('should end player turn successfully', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            const result = service.endPlayerTurn(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockTimerService.endTurnManual).toHaveBeenCalledWith(session);
            expect(result).toBe(session);
        });

        it('should throw BadRequestException when not player turn', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.endPlayerTurn(MOCK_SESSION_ID, MOCK_PLAYER_ID_2)).toThrow(BadRequestException);
        });
    });

    describe('toggleDoorAction', () => {
        it('should toggle door successfully', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);
            mockActionService.calculateReachableTiles.mockReturnValue([]);

            service.toggleDoorAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockActionService.toggleDoor).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position);
            expect(mockTrackingService.trackDoorToggled).toHaveBeenCalledWith(MOCK_SESSION_ID, position);
            expect(session.inGamePlayers[MOCK_PLAYER_ID_1].actionsRemaining).toBe(0);
            expect(session.currentTurn.hasUsedAction).toBe(true);
        });

        it('should end turn when no actions remaining and no speed', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 1, speed: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);
            mockActionService.calculateReachableTiles.mockReturnValue([]);

            service.toggleDoorAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockTimerService.endTurnManual).toHaveBeenCalledWith(session);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.toggleDoorAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.toggleDoorAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });
    });

    describe('pickUpFlag', () => {
        it('should pick up flag successfully', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);
            mockActionService.calculateReachableTiles.mockReturnValue([]);

            service.pickUpFlag(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockActionService.pickUpFlag).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position);
            expect(session.inGamePlayers[MOCK_PLAYER_ID_1].actionsRemaining).toBe(0);
            expect(session.currentTurn.hasUsedAction).toBe(true);
        });

        it('should throw BadRequestException when not CTF game', () => {
            const session = createMockSession({ mode: GameMode.CLASSIC });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.pickUpFlag(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.pickUpFlag(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.pickUpFlag(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });
    });

    describe('requestFlagTransfer', () => {
        it('should request flag transfer successfully', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);
            mockActionService.calculateReachableTiles.mockReturnValue([]);

            service.requestFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockActionService.requestFlagTransfer).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position);
            expect(session.inGamePlayers[MOCK_PLAYER_ID_1].actionsRemaining).toBe(0);
        });

        it('should throw BadRequestException when not CTF game', () => {
            const session = createMockSession({ mode: GameMode.CLASSIC });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.requestFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.requestFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.requestFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });
    });

    describe('respondToFlagTransfer', () => {
        it('should call actionService.respondToFlagTransfer', () => {
            service.respondToFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, true);

            expect(mockActionService.respondToFlagTransfer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, true);
        });
    });

    describe('sanctuaryRequest', () => {
        it('should request sanctuary successfully', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            service.sanctuaryRequest(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, PlaceableKind.HEAL);

            expect(mockActionService.sanctuaryRequest).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position, PlaceableKind.HEAL);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.sanctuaryRequest(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, PlaceableKind.HEAL)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.sanctuaryRequest(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, PlaceableKind.HEAL)).toThrow(BadRequestException);
        });
    });

    describe('performSanctuaryAction', () => {
        it('should perform sanctuary action successfully', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            service.performSanctuaryAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, false);

            expect(mockActionService.performSanctuaryAction).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position, false);
            expect(mockTrackingService.trackSanctuaryUsed).toHaveBeenCalledWith(MOCK_SESSION_ID, position);
            expect(session.inGamePlayers[MOCK_PLAYER_ID_1].actionsRemaining).toBe(0);
        });

        it('should perform sanctuary action with double', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            service.performSanctuaryAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, true);

            expect(mockActionService.performSanctuaryAction).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position, true);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.performSanctuaryAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, false)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.performSanctuaryAction(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position, false)).toThrow(BadRequestException);
        });
    });

    describe('movePlayer', () => {
        it('should move player successfully', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);
            mockTimerService.getGameTimerState.mockReturnValue(TurnTimerStates.PlayerTurn);
            mockActionService.movePlayer.mockReturnValue(MOCK_SPEED);
            mockActionService.calculateAvailableActions.mockReturnValue([]);
            mockActionService.calculateReachableTiles.mockReturnValue([]);

            service.movePlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, Orientation.N);

            expect(mockActionService.movePlayer).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, Orientation.N);
            expect(mockTrackingService.trackTileVisited).toHaveBeenCalled();
        });

        it('should end turn when no reachable tiles and no actions', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);
            mockTimerService.getGameTimerState.mockReturnValue(TurnTimerStates.PlayerTurn);
            mockActionService.movePlayer.mockReturnValue(MOCK_SPEED);
            mockActionService.calculateAvailableActions.mockReturnValue([]);
            mockActionService.calculateReachableTiles.mockReturnValue([]);

            service.movePlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, Orientation.N);

            expect(mockTimerService.endTurnManual).toHaveBeenCalledWith(session);
        });

        it('should throw BadRequestException when not player turn', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.movePlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, Orientation.N)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when timer state is not PlayerTurn', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);
            mockTimerService.getGameTimerState.mockReturnValue(TurnTimerStates.TurnTransition);

            expect(() => service.movePlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, Orientation.N)).toThrow(BadRequestException);
        });
    });

    describe('getReachableTiles', () => {
        it('should end turn when no reachable tiles and no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);
            mockActionService.calculateReachableTiles.mockReturnValue([]);

            service.getReachableTiles(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockTimerService.endTurnManual).toHaveBeenCalledWith(session);
        });

        it('should not end turn when reachable tiles exist', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);
            const reachableTiles: ReachableTile[] = [{ x: MOCK_X, y: MOCK_Y, cost: 1, remainingPoints: MOCK_SPEED }];
            mockActionService.calculateReachableTiles.mockReturnValue(reachableTiles);

            service.getReachableTiles(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockTimerService.endTurnManual).not.toHaveBeenCalled();
        });
    });

    describe('getAvailableActions', () => {
        it('should call actionService.calculateAvailableActions', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            service.getAvailableActions(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockActionService.calculateAvailableActions).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1);
        });
    });

    describe('toggleAdminMode', () => {
        it('should toggle admin mode successfully', () => {
            const session = createMockSession({ isAdminModeActive: false });
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, isAdmin: true });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);

            const result = service.toggleAdminMode(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(session.isAdminModeActive).toBe(true);
            expect(mockRepository.update).toHaveBeenCalledWith(session);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.AdminModeToggled,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    playerId: MOCK_PLAYER_ID_1,
                    isAdminModeActive: true,
                }),
            );
            expect(result).toBe(session);
        });

        it('should toggle admin mode off', () => {
            const session = createMockSession({ isAdminModeActive: true });
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, isAdmin: true });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);

            service.toggleAdminMode(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(session.isAdminModeActive).toBe(false);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.toggleAdminMode(MOCK_SESSION_ID, MOCK_PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when player is not admin', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, isAdmin: false });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.toggleAdminMode(MOCK_SESSION_ID, MOCK_PLAYER_ID_1)).toThrow(BadRequestException);
        });
    });

    describe('teleportPlayer', () => {
        it('should teleport player successfully', () => {
            const session = createMockSession({ isAdminModeActive: true });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            const tile = createMockTile({ kind: TileKind.BASE });
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(true);
            mockActionService.getTileAtPosition.mockReturnValue(tile);
            mockActionService.calculateReachableTiles.mockReturnValue([]);
            mockActionService.calculateAvailableActions.mockReturnValue([]);

            service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockRepository.movePlayerPosition).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_X_2, MOCK_Y_2, 0);
            expect(mockTrackingService.trackTileVisited).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);
        });

        it('should teleport to destination when tile is TELEPORT', () => {
            const session = createMockSession({ isAdminModeActive: true });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const destination: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            const tile = createMockTile({ kind: TileKind.TELEPORT });
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(true);
            mockActionService.getTileAtPosition.mockReturnValue(tile);
            mockActionService.getTeleportDestination.mockReturnValue(destination);
            mockActionService.getTileOccupant.mockReturnValue(null);
            mockActionService.calculateReachableTiles.mockReturnValue([]);
            mockActionService.calculateAvailableActions.mockReturnValue([]);

            service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.Teleported,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                    originX: MOCK_X,
                    originY: MOCK_Y,
                    destinationX: MOCK_X_2,
                    destinationY: MOCK_Y_2,
                }),
            );
            expect(mockRepository.movePlayerPosition).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_X_2, MOCK_Y_2, 0);
        });

        it('should not teleport to destination when destination has occupant', () => {
            const session = createMockSession({ isAdminModeActive: true });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const destination: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            const tile = createMockTile({ kind: TileKind.TELEPORT });
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(true);
            mockActionService.getTileAtPosition.mockReturnValue(tile);
            mockActionService.getTeleportDestination.mockReturnValue(destination);
            mockActionService.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);
            mockActionService.calculateReachableTiles.mockReturnValue([]);
            mockActionService.calculateAvailableActions.mockReturnValue([]);

            service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.Teleported, expect.anything());
            expect(mockRepository.movePlayerPosition).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_X, MOCK_Y, 0);
        });

        it('should handle teleport error gracefully', () => {
            const session = createMockSession({ isAdminModeActive: true });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const tile = createMockTile({ kind: TileKind.TELEPORT });
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(true);
            mockActionService.getTileAtPosition.mockReturnValue(tile);
            mockActionService.getTeleportDestination.mockImplementation(() => {
                throw new Error('Teleport error');
            });
            mockActionService.calculateReachableTiles.mockReturnValue([]);
            mockActionService.calculateAvailableActions.mockReturnValue([]);

            service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockRepository.movePlayerPosition).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_X, MOCK_Y, 0);
        });

        it('should update flag position when player has flag in CTF mode', () => {
            const session = createMockSession({ isAdminModeActive: true, mode: GameMode.CTF });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            const tile = createMockTile({ kind: TileKind.BASE });
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(true);
            mockActionService.getTileAtPosition.mockReturnValue(tile);
            mockRepository.playerHasFlag.mockReturnValue(true);
            mockActionService.calculateReachableTiles.mockReturnValue([]);
            mockActionService.calculateAvailableActions.mockReturnValue([]);

            service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockRepository.updateFlagPosition).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position);
        });

        it('should pick up flag when player teleports to flag position in CTF mode', () => {
            const session = createMockSession({ isAdminModeActive: true, mode: GameMode.CTF });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            const tile = createMockTile({ kind: TileKind.BASE });
            const placeable = createMockPlaceable({ kind: PlaceableKind.FLAG, placed: true });
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(true);
            mockActionService.getTileAtPosition.mockReturnValue(tile);
            mockRepository.playerHasFlag.mockReturnValue(false);
            mockActionService.getPlaceableAtPosition.mockReturnValue(placeable);
            mockActionService.calculateReachableTiles.mockReturnValue([]);
            mockActionService.calculateAvailableActions.mockReturnValue([]);

            service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockRepository.pickUpFlag).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position);
        });

        it('should check CTF victory when player has flag and returns to start point', () => {
            const session = createMockSession({ isAdminModeActive: true, mode: GameMode.CTF });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const tile = createMockTile({ kind: TileKind.BASE });
            const startPoint = createMockStartPoint({ x: MOCK_X, y: MOCK_Y });
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(true);
            mockActionService.getTileAtPosition.mockReturnValue(tile);
            mockRepository.playerHasFlag.mockReturnValue(true);
            mockRepository.findStartPointById.mockReturnValue(startPoint);
            mockActionService.calculateReachableTiles.mockReturnValue([]);
            mockActionService.calculateAvailableActions.mockReturnValue([]);

            service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.GameOver,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    winnerId: MOCK_PLAYER_ID_1,
                    winnerName: MOCK_PLAYER_NAME_1,
                }),
            );
        });

        it('should throw BadRequestException when admin mode not active', () => {
            const session = createMockSession({ isAdminModeActive: false });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when not player turn', () => {
            const session = createMockSession({ isAdminModeActive: true });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when tile is not free', () => {
            const session = createMockSession({ isAdminModeActive: true });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(false);

            expect(() => service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession({ isAdminModeActive: true });
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(true);

            expect(() => service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when tile not found', () => {
            const session = createMockSession({ isAdminModeActive: true });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);
            mockActionService.isTileFree.mockReturnValue(true);
            mockActionService.getTileAtPosition.mockReturnValue(null);

            expect(() => service.teleportPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });
    });

    describe('checkCTFVictory', () => {
        it('should emit GameOver when player returns to start point with flag', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const startPoint = createMockStartPoint({ x: MOCK_X, y: MOCK_Y });
            mockRepository.findStartPointById.mockReturnValue(startPoint);
            mockRepository.playerHasFlag.mockReturnValue(true);

            service['checkCTFVictory'](session, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.GameOver,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    winnerId: MOCK_PLAYER_ID_1,
                    winnerName: MOCK_PLAYER_NAME_1,
                }),
            );
        });

        it('should not emit GameOver when player not at start point', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            const startPoint = createMockStartPoint({ x: MOCK_X, y: MOCK_Y });
            mockRepository.findStartPointById.mockReturnValue(startPoint);
            mockRepository.playerHasFlag.mockReturnValue(true);

            service['checkCTFVictory'](session, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.GameOver, expect.anything());
        });

        it('should not emit GameOver when player does not have flag', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const startPoint = createMockStartPoint({ x: MOCK_X, y: MOCK_Y });
            mockRepository.findStartPointById.mockReturnValue(startPoint);
            mockRepository.playerHasFlag.mockReturnValue(false);

            service['checkCTFVictory'](session, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.GameOver, expect.anything());
        });

        it('should return early when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service['checkCTFVictory'](session, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should return early when start point not found', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findStartPointById.mockReturnValue(null);

            service['checkCTFVictory'](session, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });
    });

    describe('fetchAndCacheGame', () => {
        it('should call actionService.fetchAndCacheGame', async () => {
            const game = {} as Game;
            mockActionService.fetchAndCacheGame.mockResolvedValue(game);

            const result = await service.fetchAndCacheGame(MOCK_SESSION_ID, 'game-123');

            expect(mockActionService.fetchAndCacheGame).toHaveBeenCalledWith(MOCK_SESSION_ID, 'game-123');
            expect(result).toBe(game);
        });
    });

    describe('getInitialFlagData', () => {
        it('should call actionService.getInitialFlagData', () => {
            const flagData: FlagData = { holderPlayerId: null, position: { x: MOCK_X, y: MOCK_Y } };
            mockActionService.getInitialFlagData.mockReturnValue(flagData);

            const result = service.getInitialFlagData(MOCK_SESSION_ID);

            expect(mockActionService.getInitialFlagData).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(result).toBe(flagData);
        });
    });

    describe('clearSessionResources', () => {
        it('should clear session game cache and active combat', () => {
            service.clearSessionResources(MOCK_SESSION_ID);

            expect(mockActionService.clearSessionGameCache).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockActionService.clearActiveCombatForSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });
    });

    describe('boardBoat', () => {
        it('should board boat successfully', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            service.boardBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockActionService.boardBoat).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position);
            expect(session.inGamePlayers[MOCK_PLAYER_ID_1].actionsRemaining).toBe(0);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.boardBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.boardBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when player already on boat', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, onBoatId: MOCK_BOAT_ID });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.boardBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });
    });

    describe('disembarkBoat', () => {
        it('should disembark boat successfully', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, onBoatId: MOCK_BOAT_ID });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            service.disembarkBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position);

            expect(mockActionService.disembarkBoat).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position);
            expect(session.inGamePlayers[MOCK_PLAYER_ID_1].actionsRemaining).toBe(0);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.disembarkBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0, onBoatId: MOCK_BOAT_ID });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.disembarkBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when player not on boat', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockRepository.findById.mockReturnValue(session);

            expect(() => service.disembarkBoat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });
    });

    describe('selectVPPosture', () => {
        it('should select OFFENSIVE posture for Offensive virtual player', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, virtualPlayerType: VirtualPlayerType.Offensive });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);

            service.selectVPPosture(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockActionService.selectCombatPosture).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.OFFENSIVE);
        });

        it('should select DEFENSIVE posture for Defensive virtual player', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, virtualPlayerType: VirtualPlayerType.Defensive });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);

            service.selectVPPosture(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockActionService.selectCombatPosture).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.DEFENSIVE);
        });

        it('should return early when player has no virtualPlayerType', () => {
            const session = createMockSession();
            mockRepository.findById.mockReturnValue(session);

            service.selectVPPosture(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockActionService.selectCombatPosture).not.toHaveBeenCalled();
        });

        it('should return early when player not found', () => {
            const session = createMockSession();
            delete session.inGamePlayers[MOCK_PLAYER_ID_1];
            mockRepository.findById.mockReturnValue(session);

            service.selectVPPosture(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);

            expect(mockActionService.selectCombatPosture).not.toHaveBeenCalled();
        });
    });

    describe('handleVPCombat', () => {
        it('should select posture for playerA when virtual', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, virtualPlayerType: VirtualPlayerType.Offensive });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);
            mockRepository.isVirtualPlayer.mockReturnValue(true);

            service.handleVPCombat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);

            expect(mockActionService.selectCombatPosture).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.OFFENSIVE);
        });

        it('should select posture for playerB when virtual', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_2, virtualPlayerType: VirtualPlayerType.Defensive });
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player;
            mockRepository.findById.mockReturnValue(session);
            mockRepository.isVirtualPlayer.mockReturnValueOnce(false).mockReturnValueOnce(true);

            service.handleVPCombat(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);

            expect(mockActionService.selectCombatPosture).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, CombatPosture.DEFENSIVE);
        });

        it('should get active combat when playerAId and playerBId not provided', () => {
            const session = createMockSession();
            const activeCombat = { playerAId: MOCK_PLAYER_ID_1, playerBId: MOCK_PLAYER_ID_2 };
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, virtualPlayerType: VirtualPlayerType.Offensive });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            mockRepository.findById.mockReturnValue(session);
            mockActionService.getActiveCombat.mockReturnValue(activeCombat);
            mockRepository.isVirtualPlayer.mockReturnValue(true);

            service.handleVPCombat(MOCK_SESSION_ID);

            expect(mockActionService.getActiveCombat).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockActionService.selectCombatPosture).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.OFFENSIVE);
        });

        it('should return early when active combat not found and no player IDs provided', () => {
            mockActionService.getActiveCombat.mockReturnValue(null);

            service.handleVPCombat(MOCK_SESSION_ID);

            expect(mockActionService.selectCombatPosture).not.toHaveBeenCalled();
        });
    });
});

