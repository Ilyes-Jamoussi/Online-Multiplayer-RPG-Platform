/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { Player } from '@common/interfaces/player.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import 'reflect-metadata';
import { Server, Socket } from 'socket.io';
import { InGameGateway } from './in-game.gateway';

describe('InGameGateway', () => {
    let gateway: InGameGateway;
    let inGameService: jest.Mocked<InGameService>;
    let mockServer: jest.Mocked<Server> & { mockBroadcastOperator: { emit: jest.Mock } };
    let mockSocket: jest.Mocked<Socket>;

    const SESSION_ID = 'session-123';
    const IN_GAME_ID = 'in-game-789';
    const SOCKET_ID = 'socket-id-123';
    const PLAYER_ID = 'player-123';
    const PLAYER_NAME = 'Player 1';
    const TARGET_X = 5;
    const TARGET_Y = 6;
    const TURN_NUMBER = 3;
    const SPEED = 2;
    const WINNER_ID = 'winner-123';
    const WINNER_NAME = 'Winner Player';

    const createMockSocket = (id: string = SOCKET_ID): jest.Mocked<Socket> => {
        return {
            id,
            emit: jest.fn(),
            leave: jest.fn(),
        } as unknown as jest.Mocked<Socket>;
    };

    const createMockServer = (): jest.Mocked<Server> & { mockBroadcastOperator: { emit: jest.Mock } } => {
        const mockBroadcastOperator = {
            emit: jest.fn(),
        };
        const mockServerObj = {
            to: jest.fn().mockReturnValue(mockBroadcastOperator),
            emit: jest.fn(),
            socketsLeave: jest.fn(),
            mockBroadcastOperator,
        };
        return mockServerObj as unknown as jest.Mocked<Server> & { mockBroadcastOperator: { emit: jest.Mock } };
    };

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: PLAYER_ID,
        name: PLAYER_NAME,
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
        baseAttack: 10,
        attackBonus: 0,
        baseDefense: 5,
        defenseBonus: 0,
        attackDice: Dice.D6,
        defenseDice: Dice.D4,
        x: 0,
        y: 0,
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

    const createMockInGameSession = (overrides: Partial<InGameSession> = {}): InGameSession => {
        return {
            id: SESSION_ID,
            inGameId: IN_GAME_ID,
            isGameStarted: false,
            isAdminModeActive: false,
            currentTurn: {
                activePlayerId: PLAYER_ID,
                turnNumber: TURN_NUMBER,
                hasUsedAction: false,
            },
            inGamePlayers: {
                [PLAYER_ID]: createMockPlayer(),
            },
            ...overrides,
        } as InGameSession;
    };

    const createMockReachableTile = (overrides: Partial<ReachableTile> = {}): ReachableTile => ({
        x: TARGET_X,
        y: TARGET_Y,
        cost: 1,
        remainingPoints: SPEED,
        ...overrides,
    });

    const createMockAvailableAction = (overrides: Partial<AvailableAction> = {}): AvailableAction => ({
        type: AvailableActionType.DOOR,
        x: TARGET_X,
        y: TARGET_Y,
        ...overrides,
    });

    beforeEach(async () => {
        mockServer = createMockServer();
        mockSocket = createMockSocket();

        const mockInGameService = {
            joinInGameSession: jest.fn(),
            endPlayerTurn: jest.fn(),
            getSession: jest.fn(),
            leaveInGameSession: jest.fn(),
            toggleDoorAction: jest.fn(),
            movePlayer: jest.fn(),
            toggleAdminMode: jest.fn(),
            teleportPlayer: jest.fn(),
            getReachableTiles: jest.fn(),
            getAvailableActions: jest.fn(),
            findSessionByPlayerId: jest.fn(),
            removeSession: jest.fn(),
            storeGameStatistics: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InGameGateway,
                {
                    provide: InGameService,
                    useValue: mockInGameService,
                },
            ],
        }).compile();

        gateway = module.get<InGameGateway>(InGameGateway);
        inGameService = module.get(InGameService);

        (gateway as unknown as { server: jest.Mocked<Server> }).server = mockServer;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('ValidationPipe exceptionFactory', () => {
        it('should trigger validation error factory', () => {
            const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
            const mockErrors = [{ property: 'sessionId', constraints: { isString: 'sessionId must be a string' } }];

            expect(() => {
                validationExceptionFactory(mockErrors);
            }).toThrow('Validation failed');

            expect(loggerSpy).toHaveBeenCalledWith('Validation failed:', mockErrors);
            loggerSpy.mockRestore();
        });
    });

    describe('playerJoinInGameSession', () => {
        it('should join session and emit PlayerJoinedInGameSession', () => {
            const session = createMockInGameSession();
            inGameService.joinInGameSession.mockReturnValue(session);

            gateway.playerJoinInGameSession(mockSocket, SESSION_ID);

            expect(inGameService.joinInGameSession).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerJoinedInGameSession,
                expect.objectContaining({
                    success: true,
                    data: session,
                }),
            );
        });

        it('should emit GameStarted when isGameStarted is true', () => {
            const session = createMockInGameSession({ isGameStarted: true });
            inGameService.joinInGameSession.mockReturnValue(session);

            gateway.playerJoinInGameSession(mockSocket, SESSION_ID);

            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.GameStarted,
                expect.objectContaining({
                    success: true,
                    data: session,
                }),
            );
        });

        it('should not emit GameStarted when isGameStarted is false', () => {
            const session = createMockInGameSession({ isGameStarted: false });
            inGameService.joinInGameSession.mockReturnValue(session);

            gateway.playerJoinInGameSession(mockSocket, SESSION_ID);

            const gameStartedCalls = mockServer.mockBroadcastOperator.emit.mock.calls.filter((call) => call[0] === InGameEvents.GameStarted);
            expect(gameStartedCalls).toHaveLength(0);
        });

        it('should handle error and emit error response', () => {
            const errorMessage = 'Session not found';
            inGameService.joinInGameSession.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.playerJoinInGameSession(mockSocket, SESSION_ID);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.PlayerJoinedInGameSession, {
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('playerEndTurn', () => {
        it('should end turn and emit TurnEnded', () => {
            const session = createMockInGameSession();
            inGameService.endPlayerTurn.mockReturnValue(session);

            gateway.playerEndTurn(mockSocket, SESSION_ID);

            expect(inGameService.endPlayerTurn).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.TurnEnded,
                expect.objectContaining({
                    success: true,
                    data: session,
                }),
            );
        });

        it('should handle error and emit error response', () => {
            const errorMessage = 'Not your turn';
            inGameService.endPlayerTurn.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.playerEndTurn(mockSocket, SESSION_ID);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.TurnEnded, {
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('playerLeaveInGameSession', () => {
        it('should leave session and emit LeftInGameSessionAck', () => {
            const session = createMockInGameSession();
            inGameService.getSession.mockReturnValue(session);

            gateway.playerLeaveInGameSession(mockSocket, SESSION_ID);

            expect(inGameService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(SOCKET_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(InGameEvents.LeftInGameSessionAck, {
                success: true,
                data: {},
            });
            expect(mockSocket.leave).toHaveBeenCalledWith(IN_GAME_ID);
        });
    });

    describe('toggleDoorAction', () => {
        it('should call toggleDoorAction successfully', () => {
            const payload = { sessionId: SESSION_ID, x: TARGET_X, y: TARGET_Y };

            gateway.toggleDoorAction(mockSocket, payload);

            expect(inGameService.toggleDoorAction).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID, { x: TARGET_X, y: TARGET_Y });
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should handle error and emit error response', () => {
            const payload = { sessionId: SESSION_ID, x: TARGET_X, y: TARGET_Y };
            const errorMessage = 'No actions remaining';
            inGameService.toggleDoorAction.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.toggleDoorAction(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.ToggleDoorAction, {
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('playerMove', () => {
        it('should call movePlayer successfully', () => {
            const payload = { sessionId: SESSION_ID, orientation: Orientation.N };

            gateway.playerMove(mockSocket, payload);

            expect(inGameService.movePlayer).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID, Orientation.N);
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should handle error and emit error response', () => {
            const payload = { sessionId: SESSION_ID, orientation: Orientation.S };
            const errorMessage = 'Not enough movement points';
            inGameService.movePlayer.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.playerMove(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.PlayerMoved, {
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('handleTurnStarted', () => {
        it('should emit TurnStarted and call getReachableTiles and getAvailableActions', () => {
            const session = createMockInGameSession();
            const payload = { session };

            gateway.handleTurnStarted(payload);

            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.TurnStarted,
                expect.objectContaining({
                    success: true,
                    data: session,
                }),
            );
            expect(inGameService.getReachableTiles).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
            expect(inGameService.getAvailableActions).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });
    });

    describe('handleTurnEnded', () => {
        it('should emit TurnEnded', () => {
            const session = createMockInGameSession();
            const payload = { session };

            gateway.handleTurnEnded(payload);

            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.TurnEnded,
                expect.objectContaining({
                    success: true,
                    data: session,
                }),
            );
        });
    });

    describe('handleTurnTransition', () => {
        it('should emit TurnTransitionEnded', () => {
            const session = createMockInGameSession();
            const payload = { session };

            gateway.handleTurnTransition(payload);

            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.TurnTransitionEnded,
                expect.objectContaining({
                    success: true,
                    data: session,
                }),
            );
        });
    });

    describe('handleTurnTimeout', () => {
        it('should emit TurnTimeout', () => {
            const session = createMockInGameSession();
            const payload = { session };

            gateway.handleTurnTimeout(payload);

            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.TurnTimeout,
                expect.objectContaining({
                    success: true,
                    data: session,
                }),
            );
        });
    });

    describe('handleForcedEnd', () => {
        it('should emit TurnForcedEnd', () => {
            const session = createMockInGameSession();
            const payload = { session };

            gateway.handleForcedEnd(payload);

            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.TurnForcedEnd,
                expect.objectContaining({
                    success: true,
                    data: session,
                }),
            );
        });
    });

    describe('handleDoorToggled', () => {
        it('should emit DoorToggled and PlayerActionUsed', () => {
            const session = createMockInGameSession();
            const payload = {
                session,
                playerId: PLAYER_ID,
                x: TARGET_X,
                y: TARGET_Y,
                isOpen: true,
            };

            gateway.handleDoorToggled(payload);

            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.DoorToggled,
                expect.objectContaining({
                    success: true,
                    data: {
                        x: TARGET_X,
                        y: TARGET_Y,
                        isOpen: true,
                    },
                }),
            );
            expect(mockServer.to).toHaveBeenCalledWith(PLAYER_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(InGameEvents.PlayerActionUsed, {
                success: true,
                data: {},
            });
        });

        it('should emit DoorToggled with isOpen false', () => {
            const session = createMockInGameSession();
            const payload = {
                session,
                playerId: PLAYER_ID,
                x: TARGET_X,
                y: TARGET_Y,
                isOpen: false,
            };

            gateway.handleDoorToggled(payload);

            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.DoorToggled,
                expect.objectContaining({
                    success: true,
                    data: {
                        x: TARGET_X,
                        y: TARGET_Y,
                        isOpen: false,
                    },
                }),
            );
        });
    });

    describe('handlePlayerMoved', () => {
        it('should emit PlayerMoved', () => {
            const session = createMockInGameSession();
            const payload = {
                session,
                playerId: PLAYER_ID,
                x: TARGET_X,
                y: TARGET_Y,
                speed: SPEED,
                boatSpeed: 0,
            };

            gateway.handlePlayerMoved(payload);

            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerMoved,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: PLAYER_ID,
                        x: TARGET_X,
                        y: TARGET_Y,
                        speed: SPEED,
                        boatSpeed: 0,
                    },
                }),
            );
        });
    });

    describe('handlePlayerReachableTiles', () => {
        it('should emit PlayerReachableTiles', () => {
            const reachableTiles = [createMockReachableTile()];
            const payload = {
                playerId: PLAYER_ID,
                reachable: reachableTiles,
            };

            gateway.handlePlayerReachableTiles(payload);

            expect(mockServer.to).toHaveBeenCalledWith(PLAYER_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerReachableTiles,
                expect.objectContaining({
                    success: true,
                    data: reachableTiles,
                }),
            );
        });
    });

    describe('handleToggleAdminMode', () => {
        it('should toggle admin mode and emit AdminModeToggled', () => {
            const session = createMockInGameSession({ isAdminModeActive: true });
            inGameService.toggleAdminMode.mockReturnValue(session);

            gateway.handleToggleAdminMode(mockSocket, SESSION_ID);

            expect(inGameService.toggleAdminMode).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.AdminModeToggled,
                expect.objectContaining({
                    success: true,
                    data: {
                        isAdminModeActive: true,
                    },
                }),
            );
        });

        it('should emit AdminModeToggled with isAdminModeActive false', () => {
            const session = createMockInGameSession({ isAdminModeActive: false });
            inGameService.toggleAdminMode.mockReturnValue(session);

            gateway.handleToggleAdminMode(mockSocket, SESSION_ID);

            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.AdminModeToggled,
                expect.objectContaining({
                    success: true,
                    data: {
                        isAdminModeActive: false,
                    },
                }),
            );
        });

        it('should handle error and emit error response', () => {
            const errorMessage = 'Player not found';
            inGameService.toggleAdminMode.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.handleToggleAdminMode(mockSocket, SESSION_ID);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.AdminModeToggled, {
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('playerTeleport', () => {
        it('should teleport player and emit PlayerTeleported', () => {
            const session = createMockInGameSession();
            const player = createMockPlayer({ x: TARGET_X, y: TARGET_Y });
            session.inGamePlayers[SOCKET_ID] = player;
            inGameService.getSession.mockReturnValue(session);

            gateway.playerTeleport(mockSocket, { sessionId: SESSION_ID, x: TARGET_X, y: TARGET_Y });

            expect(inGameService.teleportPlayer).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID, { x: TARGET_X, y: TARGET_Y });
            expect(inGameService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerTeleported,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: SOCKET_ID,
                        x: TARGET_X,
                        y: TARGET_Y,
                    },
                }),
            );
            expect(inGameService.getReachableTiles).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID);
        });

        it('should handle error and emit error response', () => {
            const errorMessage = 'Tile not free';
            inGameService.teleportPlayer.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.playerTeleport(mockSocket, { sessionId: SESSION_ID, x: TARGET_X, y: TARGET_Y });

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.PlayerTeleported, {
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('handlePlayerUpdated', () => {
        it('should emit PlayerUpdated', () => {
            const session = createMockInGameSession();
            const player = createMockPlayer();
            inGameService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                player,
            };

            gateway.handlePlayerUpdated(payload);

            expect(inGameService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerUpdated,
                expect.objectContaining({
                    success: true,
                    data: player,
                }),
            );
        });
    });

    describe('handlePlayerAvailableActions', () => {
        it('should emit PlayerAvailableActions', () => {
            const session = createMockInGameSession();
            const actions = [createMockAvailableAction()];
            const payload = {
                session,
                playerId: PLAYER_ID,
                actions,
            };

            gateway.handlePlayerAvailableActions(payload);

            expect(mockServer.to).toHaveBeenCalledWith(PLAYER_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerAvailableActions,
                expect.objectContaining({
                    success: true,
                    data: { availableActions: actions },
                }),
            );
        });
    });

    describe('handleGameOver', () => {
        it('should emit GameOver and call socketsLeave', () => {
            const session = createMockInGameSession();
            inGameService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                winnerId: WINNER_ID,
                winnerName: WINNER_NAME,
            };

            gateway.handleGameOver(payload);

            expect(inGameService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(inGameService.storeGameStatistics).toHaveBeenCalledWith(SESSION_ID, WINNER_ID, WINNER_NAME);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.GameOver,
                expect.objectContaining({
                    success: true,
                    data: {
                        winnerId: WINNER_ID,
                        winnerName: WINNER_NAME,
                    },
                }),
            );
            expect(mockServer.socketsLeave).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.socketsLeave).toHaveBeenCalledWith(SESSION_ID);
            expect(inGameService.removeSession).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('handleDisconnect', () => {
        it('should call playerLeaveSession when session exists', () => {
            const session = createMockInGameSession();
            inGameService.findSessionByPlayerId.mockReturnValue(session);

            type GatewayWithPrivateMethod = {
                playerLeaveSession: (sessionId: string, playerId: string) => void;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;
            const playerLeaveSessionSpy = jest.spyOn(gatewayPrivate, 'playerLeaveSession');

            gateway.handleDisconnect(mockSocket);

            expect(inGameService.findSessionByPlayerId).toHaveBeenCalledWith(SOCKET_ID);
            expect(playerLeaveSessionSpy).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID);
            playerLeaveSessionSpy.mockRestore();
        });

        it('should not call playerLeaveSession when session does not exist', () => {
            inGameService.findSessionByPlayerId.mockReturnValue(null);

            type GatewayWithPrivateMethod = {
                playerLeaveSession: (sessionId: string, playerId: string) => void;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;
            const playerLeaveSessionSpy = jest.spyOn(gatewayPrivate, 'playerLeaveSession');

            gateway.handleDisconnect(mockSocket);

            expect(inGameService.findSessionByPlayerId).toHaveBeenCalledWith(SOCKET_ID);
            expect(playerLeaveSessionSpy).not.toHaveBeenCalled();
            playerLeaveSessionSpy.mockRestore();
        });
    });

    describe('playerLeaveSession', () => {
        it('should emit GameForceStopped when sessionEnded is true', () => {
            const session = createMockInGameSession();
            const result = {
                sessionEnded: true,
                session,
                playerId: PLAYER_ID,
                playerName: PLAYER_NAME,
                adminModeDeactivated: false,
            };
            inGameService.leaveInGameSession.mockReturnValue(result);

            type GatewayWithPrivateMethod = {
                playerLeaveSession: (sessionId: string, playerId: string) => void;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            gatewayPrivate.playerLeaveSession(SESSION_ID, PLAYER_ID);

            expect(inGameService.leaveInGameSession).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
            expect(inGameService.storeGameStatistics).toHaveBeenCalledWith(SESSION_ID, '', 'Partie abandonnée');
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(InGameEvents.GameForceStopped, {
                success: true,
                data: {},
            });
            expect(mockServer.socketsLeave).toHaveBeenCalledWith(SESSION_ID);
        });

        it('should emit AdminModeToggled when adminModeDeactivated is true', () => {
            const session = createMockInGameSession();
            const result = {
                sessionEnded: false,
                session,
                playerId: PLAYER_ID,
                playerName: PLAYER_NAME,
                adminModeDeactivated: true,
            };
            inGameService.leaveInGameSession.mockReturnValue(result);

            type GatewayWithPrivateMethod = {
                playerLeaveSession: (sessionId: string, playerId: string) => void;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            gatewayPrivate.playerLeaveSession(SESSION_ID, PLAYER_ID);

            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(InGameEvents.AdminModeToggled, {
                success: true,
                data: {
                    isAdminModeActive: false,
                },
            });
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerLeftInGameSession,
                expect.objectContaining({
                    success: true,
                    data: result,
                }),
            );
        });

        it('should emit PlayerLeftInGameSession when sessionEnded is false and adminModeDeactivated is false', () => {
            const session = createMockInGameSession();
            const result = {
                sessionEnded: false,
                session,
                playerId: PLAYER_ID,
                playerName: PLAYER_NAME,
                adminModeDeactivated: false,
            };
            inGameService.leaveInGameSession.mockReturnValue(result);

            type GatewayWithPrivateMethod = {
                playerLeaveSession: (sessionId: string, playerId: string) => void;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            gatewayPrivate.playerLeaveSession(SESSION_ID, PLAYER_ID);

            const adminModeCalls = mockServer.mockBroadcastOperator.emit.mock.calls.filter((call) => call[0] === InGameEvents.AdminModeToggled);
            expect(adminModeCalls).toHaveLength(0);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerLeftInGameSession,
                expect.objectContaining({
                    success: true,
                    data: result,
                }),
            );
        });

        it('should handle error and emit error response', () => {
            const errorMessage = 'Player not found';
            inGameService.leaveInGameSession.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            type GatewayWithPrivateMethod = {
                playerLeaveSession: (sessionId: string, playerId: string) => void;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            gatewayPrivate.playerLeaveSession(SESSION_ID, PLAYER_ID);

            expect(mockServer.to).toHaveBeenCalledWith(PLAYER_ID);
            expect(mockServer.mockBroadcastOperator.emit).toHaveBeenCalledWith(InGameEvents.PlayerLeftInGameSession, {
                success: false,
                message: errorMessage,
            });
        });
    });
});
