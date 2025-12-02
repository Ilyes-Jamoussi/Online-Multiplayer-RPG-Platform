/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { NotificationEvents } from '@common/enums/notification-events.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import 'reflect-metadata';
import { Server, Socket } from 'socket.io';
import { InGameActionGateway } from './in-game-action.gateway';

const MOCK_SESSION_ID = 'session-123';
const MOCK_IN_GAME_ID = 'in-game-123';
const MOCK_SOCKET_ID = 'socket-123';
const MOCK_PLAYER_ID = 'player-123';
const MOCK_PLAYER_NAME = 'Player 1';
const MOCK_X = 5;
const MOCK_Y = 10;
const MOCK_SPEED = 3;
const MOCK_BOAT_SPEED = 2;
const MOCK_ATTACK_BONUS = 2;
const MOCK_DEFENSE_BONUS = 1;
const MOCK_ADDED_HEALTH = 5;
const MOCK_ADDED_DEFENSE = 3;
const MOCK_ADDED_ATTACK = 2;
const MOCK_TURN_COUNT = 3;
const MOCK_BOAT_ID = 'boat-123';
const MOCK_PLACEABLE_ID = 'placeable-123';
const MOCK_FROM_PLAYER_ID = 'from-player-123';
const MOCK_TO_PLAYER_ID = 'to-player-123';
const MOCK_FROM_PLAYER_NAME = 'From Player';
const MOCK_MESSAGE = 'Error message';

const createMockSocket = (): jest.Mocked<Socket> => {
    return {
        id: MOCK_SOCKET_ID,
        emit: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
};

const createMockServer = (): jest.Mocked<Server> => {
    const mockBroadcastOperator = {
        emit: jest.fn(),
    };
    return {
        to: jest.fn().mockReturnValue(mockBroadcastOperator),
        emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;
};

const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: MOCK_PLAYER_ID,
    name: MOCK_PLAYER_NAME,
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
    boatSpeed: MOCK_BOAT_SPEED,
    baseAttack: 10,
    attackBonus: 0,
    baseDefense: 5,
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
    inGameId: MOCK_IN_GAME_ID,
    gameId: 'game-123',
    chatId: 'chat-123',
    maxPlayers: 4,
    mode: GameMode.CLASSIC,
    isGameStarted: false,
    isAdminModeActive: false,
    inGamePlayers: {
        [MOCK_SOCKET_ID]: createMockPlayer({ id: MOCK_SOCKET_ID }),
    },
    teams: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Team number must be numeric
        1: { number: 1, playerIds: [MOCK_SOCKET_ID] },
    },
    currentTurn: { turnNumber: 1, activePlayerId: MOCK_SOCKET_ID, hasUsedAction: false },
    startPoints: [],
    mapSize: MapSize.MEDIUM,
    turnOrder: [MOCK_SOCKET_ID],
    playerCount: 1,
    ...overrides,
});

const createMockReachableTile = (overrides: Partial<ReachableTile> = {}): ReachableTile => ({
    x: MOCK_X,
    y: MOCK_Y,
    cost: 1,
    remainingPoints: MOCK_SPEED,
    ...overrides,
});

const createMockAvailableAction = (overrides: Partial<AvailableAction> = {}): AvailableAction => ({
    type: AvailableActionType.DOOR,
    x: MOCK_X,
    y: MOCK_Y,
    ...overrides,
});

const createMockPlaceable = (overrides: Partial<Placeable> = {}): Placeable => {
    const mockObjectId = new Types.ObjectId();
    Object.defineProperty(mockObjectId, 'toString', {
        value: jest.fn().mockReturnValue(MOCK_PLACEABLE_ID),
        writable: true,
    });
    return {
        _id: mockObjectId,
        kind: PlaceableKind.START,
        x: MOCK_X,
        y: MOCK_Y,
        orientation: Orientation.N,
        placed: true,
        ...overrides,
    };
};

describe('InGameActionGateway', () => {
    let gateway: InGameActionGateway;
    let mockInGameService: jest.Mocked<InGameService>;
    let mockServer: jest.Mocked<Server>;
    let mockSocket: jest.Mocked<Socket>;

    beforeEach(async () => {
        mockServer = createMockServer();
        mockSocket = createMockSocket();

        const mockInGameServiceValue = {
            movePlayer: jest.fn(),
            teleportPlayer: jest.fn(),
            getSession: jest.fn(),
            getReachableTiles: jest.fn(),
            toggleDoorAction: jest.fn(),
            toggleAdminMode: jest.fn(),
            boardBoat: jest.fn(),
            disembarkBoat: jest.fn(),
            sanctuaryRequest: jest.fn(),
            performSanctuaryAction: jest.fn(),
            pickUpFlag: jest.fn(),
            requestFlagTransfer: jest.fn(),
            respondToFlagTransfer: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InGameActionGateway,
                {
                    provide: InGameService,
                    useValue: mockInGameServiceValue,
                },
            ],
        }).compile();

        gateway = module.get<InGameActionGateway>(InGameActionGateway);
        mockInGameService = module.get(InGameService);

        (gateway as unknown as { server: jest.Mocked<Server> }).server = mockServer;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('playerMove', () => {
        it('should call movePlayer successfully', () => {
            const payload = { sessionId: MOCK_SESSION_ID, orientation: Orientation.N };

            gateway.playerMove(mockSocket, payload);

            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID, Orientation.N);
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error when movePlayer throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, orientation: Orientation.N };
            mockInGameService.movePlayer.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.playerMove(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(NotificationEvents.ErrorMessage, expect.objectContaining({ success: false }));
        });
    });

    describe('playerTeleport', () => {
        it('should call teleportPlayer and emit PlayerTeleported', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };
            const session = createMockSession();
            mockInGameService.getSession.mockReturnValue(session);

            gateway.playerTeleport(mockSocket, payload);

            expect(mockInGameService.teleportPlayer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID, { x: MOCK_X, y: MOCK_Y });
            expect(mockInGameService.getSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlayerTeleported,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        playerId: MOCK_SOCKET_ID,
                        x: MOCK_X,
                        y: MOCK_Y,
                    }),
                }),
            );
            expect(mockInGameService.getReachableTiles).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID);
        });

        it('should emit error when teleportPlayer throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };
            mockInGameService.teleportPlayer.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.playerTeleport(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(NotificationEvents.ErrorMessage, expect.objectContaining({ success: false }));
        });
    });

    describe('toggleDoorAction', () => {
        it('should call toggleDoorAction successfully', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };

            gateway.toggleDoorAction(mockSocket, payload);

            expect(mockInGameService.toggleDoorAction).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID, { x: MOCK_X, y: MOCK_Y });
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error when toggleDoorAction throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };
            mockInGameService.toggleDoorAction.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.toggleDoorAction(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(NotificationEvents.ErrorMessage, expect.objectContaining({ success: false }));
        });
    });

    describe('handleToggleAdminMode', () => {
        it('should call toggleAdminMode and emit AdminModeToggled', () => {
            const session = createMockSession({ isAdminModeActive: true });
            mockInGameService.toggleAdminMode.mockReturnValue(session);

            gateway.handleToggleAdminMode(mockSocket, MOCK_SESSION_ID);

            expect(mockInGameService.toggleAdminMode).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.AdminModeToggled,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        isAdminModeActive: true,
                    }),
                }),
            );
        });

        it('should emit error when toggleAdminMode throws', () => {
            mockInGameService.toggleAdminMode.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.handleToggleAdminMode(mockSocket, MOCK_SESSION_ID);

            expect(mockSocket.emit).toHaveBeenCalledWith(NotificationEvents.ErrorMessage, expect.objectContaining({ success: false }));
        });
    });

    describe('playerBoardBoat', () => {
        it('should call boardBoat successfully', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };

            gateway.playerBoardBoat(mockSocket, payload);

            expect(mockInGameService.boardBoat).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID, { x: MOCK_X, y: MOCK_Y });
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error when boardBoat throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };
            mockInGameService.boardBoat.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.playerBoardBoat(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.PlayerBoardBoat, expect.objectContaining({ success: false }));
        });
    });

    describe('playerDisembarkBoat', () => {
        it('should call disembarkBoat successfully', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };

            gateway.playerDisembarkBoat(mockSocket, payload);

            expect(mockInGameService.disembarkBoat).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID, { x: MOCK_X, y: MOCK_Y });
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error when disembarkBoat throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };
            mockInGameService.disembarkBoat.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.playerDisembarkBoat(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.PlayerDisembarkBoat, expect.objectContaining({ success: false }));
        });
    });

    describe('playerSanctuaryRequest', () => {
        it('should call sanctuaryRequest with HEAL kind', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: PlaceableKind.HEAL };

            gateway.playerSanctuaryRequest(mockSocket, payload);

            expect(mockInGameService.sanctuaryRequest).toHaveBeenCalledWith(
                MOCK_SESSION_ID,
                MOCK_SOCKET_ID,
                { x: MOCK_X, y: MOCK_Y },
                PlaceableKind.HEAL,
            );
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should call sanctuaryRequest with FIGHT kind', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: PlaceableKind.FIGHT };

            gateway.playerSanctuaryRequest(mockSocket, payload);

            expect(mockInGameService.sanctuaryRequest).toHaveBeenCalledWith(
                MOCK_SESSION_ID,
                MOCK_SOCKET_ID,
                { x: MOCK_X, y: MOCK_Y },
                PlaceableKind.FIGHT,
            );
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException for invalid sanctuary kind', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: PlaceableKind.START };

            gateway.playerSanctuaryRequest(mockSocket, payload);

            expect(mockInGameService.sanctuaryRequest).not.toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.PlayerSanctuaryRequest, expect.objectContaining({ success: false }));
        });

        it('should emit error when sanctuaryRequest throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: PlaceableKind.HEAL };
            mockInGameService.sanctuaryRequest.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.playerSanctuaryRequest(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.PlayerSanctuaryRequest, expect.objectContaining({ success: false }));
        });
    });

    describe('playerSanctuaryAction', () => {
        it('should call performSanctuaryAction successfully', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: PlaceableKind.HEAL };

            gateway.playerSanctuaryAction(mockSocket, payload);

            expect(mockInGameService.performSanctuaryAction).toHaveBeenCalledWith(
                MOCK_SESSION_ID,
                MOCK_SOCKET_ID,
                { x: MOCK_X, y: MOCK_Y },
                undefined,
            );
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should call performSanctuaryAction with double', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: PlaceableKind.HEAL, double: true };

            gateway.playerSanctuaryAction(mockSocket, payload);

            expect(mockInGameService.performSanctuaryAction).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID, { x: MOCK_X, y: MOCK_Y }, true);
        });

        it('should emit error when performSanctuaryAction throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: PlaceableKind.HEAL };
            mockInGameService.performSanctuaryAction.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.playerSanctuaryAction(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.PlayerSanctuaryAction, expect.objectContaining({ success: false }));
        });
    });

    describe('pickUpFlag', () => {
        it('should call pickUpFlag successfully', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };

            gateway.pickUpFlag(mockSocket, payload);

            expect(mockInGameService.pickUpFlag).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID, { x: MOCK_X, y: MOCK_Y });
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error when pickUpFlag throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };
            mockInGameService.pickUpFlag.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.pickUpFlag(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(NotificationEvents.ErrorMessage, expect.objectContaining({ success: false }));
        });
    });

    describe('flagTransferRequest', () => {
        it('should call requestFlagTransfer successfully', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };

            gateway.flagTransferRequest(mockSocket, payload);

            expect(mockInGameService.requestFlagTransfer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID, { x: MOCK_X, y: MOCK_Y });
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error when requestFlagTransfer throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };
            mockInGameService.requestFlagTransfer.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.flagTransferRequest(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(NotificationEvents.ErrorMessage, expect.objectContaining({ success: false }));
        });
    });

    describe('flagTransferResponse', () => {
        it('should call respondToFlagTransfer successfully', () => {
            const payload = { sessionId: MOCK_SESSION_ID, fromPlayerId: MOCK_FROM_PLAYER_ID, accepted: true };

            gateway.flagTransferResponse(mockSocket, payload);

            expect(mockInGameService.respondToFlagTransfer).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_SOCKET_ID, MOCK_FROM_PLAYER_ID, true);
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error when respondToFlagTransfer throws', () => {
            const payload = { sessionId: MOCK_SESSION_ID, fromPlayerId: MOCK_FROM_PLAYER_ID, accepted: true };
            mockInGameService.respondToFlagTransfer.mockImplementation(() => {
                throw new Error(MOCK_MESSAGE);
            });

            gateway.flagTransferResponse(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(NotificationEvents.ErrorMessage, expect.objectContaining({ success: false }));
        });
    });

    describe('handlePlayerMoved', () => {
        it('should emit PlayerMoved event', () => {
            const session = createMockSession();
            const payload = {
                session,
                playerId: MOCK_PLAYER_ID,
                x: MOCK_X,
                y: MOCK_Y,
                speed: MOCK_SPEED,
                boatSpeed: MOCK_BOAT_SPEED,
            };

            gateway.handlePlayerMoved(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlayerMoved,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        playerId: MOCK_PLAYER_ID,
                        x: MOCK_X,
                        y: MOCK_Y,
                        speed: MOCK_SPEED,
                        boatSpeed: MOCK_BOAT_SPEED,
                    }),
                }),
            );
        });
    });

    describe('handlePlayerUpdated', () => {
        it('should emit PlayerUpdated event', () => {
            const session = createMockSession();
            const player = createMockPlayer();
            mockInGameService.getSession.mockReturnValue(session);
            const payload = { sessionId: MOCK_SESSION_ID, player };

            gateway.handlePlayerUpdated(payload);

            expect(mockInGameService.getSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlayerUpdated,
                expect.objectContaining({ success: true, data: player }),
            );
        });
    });

    describe('handlePlayerReachableTiles', () => {
        it('should emit PlayerReachableTiles event', () => {
            const reachableTiles = [createMockReachableTile()];
            const payload = { playerId: MOCK_PLAYER_ID, reachable: reachableTiles };

            gateway.handlePlayerReachableTiles(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_PLAYER_ID);
            expect(mockServer.to(MOCK_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlayerReachableTiles,
                expect.objectContaining({ success: true, data: reachableTiles }),
            );
        });
    });

    describe('handlePlayerAvailableActions', () => {
        it('should emit PlayerAvailableActions event', () => {
            const session = createMockSession();
            const actions = [createMockAvailableAction()];
            const payload = { session, playerId: MOCK_PLAYER_ID, actions };

            gateway.handlePlayerAvailableActions(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_PLAYER_ID);
            expect(mockServer.to(MOCK_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlayerAvailableActions,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        availableActions: actions,
                    }),
                }),
            );
        });
    });

    describe('handleDoorToggled', () => {
        it('should emit DoorToggled and PlayerActionUsed events', () => {
            const session = createMockSession();
            const payload = { session, playerId: MOCK_PLAYER_ID, x: MOCK_X, y: MOCK_Y, isOpen: true };

            gateway.handleDoorToggled(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.DoorToggled,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        x: MOCK_X,
                        y: MOCK_Y,
                        isOpen: true,
                    }),
                }),
            );
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_PLAYER_ID);
            expect(mockServer.to(MOCK_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlayerActionUsed,
                expect.objectContaining({ success: true }),
            );
        });
    });

    describe('handlePlayerBoardedBoat', () => {
        it('should emit PlayerBoardedBoat event', () => {
            const session = createMockSession();
            const payload = { session, playerId: MOCK_PLAYER_ID, boatId: MOCK_BOAT_ID };

            gateway.handlePlayerBoardedBoat(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlayerBoardedBoat,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        playerId: MOCK_PLAYER_ID,
                        boatId: MOCK_BOAT_ID,
                    }),
                }),
            );
        });
    });

    describe('handlePlayerDisembarkedBoat', () => {
        it('should emit PlayerDisembarkedBoat event', () => {
            const session = createMockSession();
            const payload = { session, playerId: MOCK_PLAYER_ID };

            gateway.handlePlayerDisembarkedBoat(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlayerDisembarkedBoat,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        playerId: MOCK_PLAYER_ID,
                    }),
                }),
            );
        });
    });

    describe('handlePlaceableUpdated', () => {
        it('should emit PlaceableUpdated event', () => {
            const session = createMockSession();
            const placeable = createMockPlaceable();
            mockInGameService.getSession.mockReturnValue(session);
            const payload = { sessionId: MOCK_SESSION_ID, placeable };

            gateway.handlePlaceableUpdated(payload);

            expect(mockInGameService.getSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlaceableUpdated,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        _id: MOCK_PLACEABLE_ID,
                    }),
                }),
            );
        });
    });

    describe('handlePlaceableDisabledUpdated', () => {
        it('should emit PlaceableDisabledUpdated event', () => {
            const session = createMockSession();
            const positions: Position[] = [{ x: MOCK_X, y: MOCK_Y }];
            mockInGameService.getSession.mockReturnValue(session);
            const payload = { sessionId: MOCK_SESSION_ID, placeableId: MOCK_PLACEABLE_ID, positions, turnCount: MOCK_TURN_COUNT };

            gateway.handlePlaceableDisabledUpdated(payload);

            expect(mockInGameService.getSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlaceableDisabledUpdated,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        placeableId: MOCK_PLACEABLE_ID,
                        positions,
                        turnCount: MOCK_TURN_COUNT,
                    }),
                }),
            );
        });
    });

    describe('handleOpenSanctuaryDenied', () => {
        it('should emit OpenSanctuary error event', () => {
            const session = createMockSession();
            const payload = { session, playerId: MOCK_PLAYER_ID, message: MOCK_MESSAGE };

            gateway.handleOpenSanctuaryDenied(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_PLAYER_ID);
            expect(mockServer.to(MOCK_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.OpenSanctuary,
                expect.objectContaining({ success: false, message: MOCK_MESSAGE }),
            );
        });
    });

    describe('handleOpenSanctuary', () => {
        it('should emit OpenSanctuary success event', () => {
            const session = createMockSession();
            const payload = { session, playerId: MOCK_PLAYER_ID, kind: PlaceableKind.HEAL, x: MOCK_X, y: MOCK_Y };

            gateway.handleOpenSanctuary(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_PLAYER_ID);
            expect(mockServer.to(MOCK_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.OpenSanctuary,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        kind: PlaceableKind.HEAL,
                        x: MOCK_X,
                        y: MOCK_Y,
                    }),
                }),
            );
        });
    });

    describe('handleSanctuaryActionFailed', () => {
        it('should emit SanctuaryActionFailed event', () => {
            const session = createMockSession();
            const payload = { session, playerId: MOCK_PLAYER_ID };

            gateway.handleSanctuaryActionFailed(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_PLAYER_ID);
            expect(mockServer.to(MOCK_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.SanctuaryActionFailed,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        message: 'Sanctuary action failed',
                    }),
                }),
            );
        });
    });

    describe('handleSanctuaryActionSuccess', () => {
        it('should emit SanctuaryActionSuccess event with all bonuses', () => {
            const session = createMockSession();
            const payload = {
                session,
                playerId: MOCK_PLAYER_ID,
                kind: PlaceableKind.HEAL,
                x: MOCK_X,
                y: MOCK_Y,
                addedHealth: MOCK_ADDED_HEALTH,
                addedDefense: MOCK_ADDED_DEFENSE,
                addedAttack: MOCK_ADDED_ATTACK,
            };

            gateway.handleSanctuaryActionSuccess(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_PLAYER_ID);
            expect(mockServer.to(MOCK_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.SanctuaryActionSuccess,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        kind: PlaceableKind.HEAL,
                        x: MOCK_X,
                        y: MOCK_Y,
                        success: true,
                        addedHealth: MOCK_ADDED_HEALTH,
                        addedDefense: MOCK_ADDED_DEFENSE,
                        addedAttack: MOCK_ADDED_ATTACK,
                    }),
                }),
            );
        });
    });

    describe('handlePlayerBonusesChanged', () => {
        it('should emit PlayerBonusesChanged event', () => {
            const session = createMockSession();
            const payload = { session, playerId: MOCK_PLAYER_ID, attackBonus: MOCK_ATTACK_BONUS, defenseBonus: MOCK_DEFENSE_BONUS };

            gateway.handlePlayerBonusesChanged(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_PLAYER_ID);
            expect(mockServer.to(MOCK_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.PlayerBonusesChanged,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        attackBonus: MOCK_ATTACK_BONUS,
                        defenseBonus: MOCK_DEFENSE_BONUS,
                    }),
                }),
            );
        });
    });

    describe('handleFlagPickedUp', () => {
        it('should emit FlagPickedUp event', () => {
            const session = createMockSession();
            const payload = { session, playerId: MOCK_PLAYER_ID };

            gateway.handleFlagPickedUp(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.FlagPickedUp,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        playerId: MOCK_PLAYER_ID,
                    }),
                }),
            );
        });
    });

    describe('handleFlagTransferRequested', () => {
        it('should emit FlagTransferRequested event', () => {
            const session = createMockSession();
            const payload = { session, fromPlayerId: MOCK_FROM_PLAYER_ID, toPlayerId: MOCK_TO_PLAYER_ID, fromPlayerName: MOCK_FROM_PLAYER_NAME };

            gateway.handleFlagTransferRequested(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_TO_PLAYER_ID);
            expect(mockServer.to(MOCK_TO_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.FlagTransferRequested,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        fromPlayerId: MOCK_FROM_PLAYER_ID,
                        toPlayerId: MOCK_TO_PLAYER_ID,
                        fromPlayerName: MOCK_FROM_PLAYER_NAME,
                    }),
                }),
            );
        });
    });

    describe('handleFlagTransferResult', () => {
        it('should emit FlagTransferResult event', () => {
            const payload = { sessionId: MOCK_SESSION_ID, fromPlayerId: MOCK_FROM_PLAYER_ID, toPlayerId: MOCK_TO_PLAYER_ID, accepted: true };

            gateway.handleFlagTransferResult(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_FROM_PLAYER_ID);
            expect(mockServer.to(MOCK_FROM_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.FlagTransferResult,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        toPlayerId: MOCK_TO_PLAYER_ID,
                        accepted: true,
                    }),
                }),
            );
        });
    });

    describe('handleFlagTransferred', () => {
        it('should emit FlagTransferred event', () => {
            const session = createMockSession();
            const payload = { session, fromPlayerId: MOCK_FROM_PLAYER_ID, toPlayerId: MOCK_TO_PLAYER_ID };

            gateway.handleFlagTransferred(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_IN_GAME_ID);
            expect(mockServer.to(MOCK_IN_GAME_ID).emit).toHaveBeenCalledWith(
                InGameEvents.FlagTransferred,
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        fromPlayerId: MOCK_FROM_PLAYER_ID,
                        toPlayerId: MOCK_TO_PLAYER_ID,
                    }),
                }),
            );
        });
    });

    describe('handleFlagTransferRequestsCleared', () => {
        it('should emit FlagTransferRequestsCleared event for each affected player', () => {
            const session = createMockSession();
            const affectedPlayerIds = [MOCK_PLAYER_ID, MOCK_FROM_PLAYER_ID];
            const payload = { session, affectedPlayerIds };

            gateway.handleFlagTransferRequestsCleared(payload);

            expect(mockServer.to).toHaveBeenCalledWith(MOCK_PLAYER_ID);
            expect(mockServer.to).toHaveBeenCalledWith(MOCK_FROM_PLAYER_ID);
            expect(mockServer.to(MOCK_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.FlagTransferRequestsCleared,
                expect.objectContaining({ success: true }),
            );
            expect(mockServer.to(MOCK_FROM_PLAYER_ID).emit).toHaveBeenCalledWith(
                InGameEvents.FlagTransferRequestsCleared,
                expect.objectContaining({ success: true }),
            );
        });
    });
});
