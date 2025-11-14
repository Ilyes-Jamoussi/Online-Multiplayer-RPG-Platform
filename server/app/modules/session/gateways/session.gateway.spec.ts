/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { AVATAR_SELECTION_ROOM_PREFIX } from '@app/constants/session.constants';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { CreateSessionDto } from '@app/modules/session/dto/create-session.dto';
import { JoinAvatarSelectionDto } from '@app/modules/session/dto/join-avatar-selection';
import { JoinSessionDto } from '@app/modules/session/dto/join-session.dto';
import { KickPlayerDto } from '@app/modules/session/dto/kick-player.dto';
import { PlayerDto } from '@app/modules/session/dto/player.dto';
import { UpdateAvatarAssignmentsDto } from '@app/modules/session/dto/update-avatar-assignments.dto';
import { SessionService } from '@app/modules/session/services/session.service';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { NotificationEvents } from '@common/enums/notification-events.enum';
import { SessionEvents } from '@common/enums/session-events.enum';
import { Player } from '@common/interfaces/player.interface';
import { WaitingRoomSession } from '@common/interfaces/session.interface';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import 'reflect-metadata';
import { Server, Socket } from 'socket.io';
import { SessionGateway } from './session.gateway';

describe('SessionGateway', () => {
    let gateway: SessionGateway;
    let sessionService: jest.Mocked<SessionService>;
    let inGameService: jest.Mocked<InGameService>;
    let mockServer: jest.Mocked<Server>;
    let mockSocket: jest.Mocked<Socket>;

    const SESSION_ID = 'session-123';
    const SOCKET_ID = 'socket-id-123';
    const GAME_ID = 'game-456';
    const MAX_PLAYERS = 4;
    const PLAYER_NAME = 'Player 1';
    const MODIFIED_PLAYER_NAME = 'Player 1 (1)';
    const AVATAR_ROOM_ID = `${AVATAR_SELECTION_ROOM_PREFIX}${SESSION_ID}`;
    const IN_GAME_ID = 'in-game-789';

    const createMockSocket = (id: string = SOCKET_ID): jest.Mocked<Socket> => {
        const socket = {
            id,
            emit: jest.fn(),
            join: jest.fn(),
            leave: jest.fn(),
            broadcast: {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            },
        } as unknown as jest.Mocked<Socket>;
        return socket;
    };

    const createMockServer = (): jest.Mocked<Server> => {
        const rooms = new Map<string, Set<string>>();
        const sockets = new Map<string, jest.Mocked<Socket>>();

        return {
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
            sockets: {
                sockets,
                adapter: {
                    rooms,
                },
            },
        } as unknown as jest.Mocked<Server>;
    };

    const createMockWaitingSession = (overrides: Partial<WaitingRoomSession> = {}): WaitingRoomSession => ({
        id: SESSION_ID,
        gameId: GAME_ID,
        maxPlayers: MAX_PLAYERS,
        players: [],
        avatarAssignments: [],
        isRoomLocked: false,
        ...overrides,
    });

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: SOCKET_ID,
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
        isInGame: false,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
        ...overrides,
    });

    beforeEach(async () => {
        mockServer = createMockServer();
        mockSocket = createMockSocket();

        const mockSessionService = {
            createSession: jest.fn(),
            getPlayersSession: jest.fn(),
            getSession: jest.fn(),
            joinSession: jest.fn(),
            leaveSession: jest.fn(),
            isAdmin: jest.fn(),
            getPlayerSessionId: jest.fn(),
            lock: jest.fn(),
            unlock: jest.fn(),
            kickPlayer: jest.fn(),
            endSession: jest.fn(),
            getAvailableSessions: jest.fn(),
            isRoomLocked: jest.fn(),
            isSessionFull: jest.fn(),
            getChosenAvatars: jest.fn(),
            releaseAvatar: jest.fn(),
            chooseAvatar: jest.fn(),
        };

        const mockInGameService = {
            createInGameSession: jest.fn(),
        };

        const mockEventEmitter = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionGateway,
                {
                    provide: SessionService,
                    useValue: mockSessionService,
                },
                {
                    provide: InGameService,
                    useValue: mockInGameService,
                },
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitter,
                },
            ],
        }).compile();

        gateway = module.get<SessionGateway>(SessionGateway);
        sessionService = module.get(SessionService);
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
        it('should trigger validation error factory (coverage for lines 25-26)', () => {
            const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
            const mockErrors = [{ property: 'gameId', constraints: { isString: 'gameId must be a string' } }];

            expect(() => {
                validationExceptionFactory(mockErrors);
            }).toThrow('Validation failed');

            expect(loggerSpy).toHaveBeenCalledWith('Validation failed:', mockErrors);
            loggerSpy.mockRestore();
        });
    });

    const createMockPlayerDto = (overrides: Partial<PlayerDto> = {}): PlayerDto => ({
        id: SOCKET_ID,
        name: PLAYER_NAME,
        avatar: Avatar.Avatar1,
        isAdmin: false,
        attackDice: Dice.D6,
        defenseDice: Dice.D4,
        baseHealth: 100,
        healthBonus: 0,
        health: 100,
        maxHealth: 100,
        baseAttack: 10,
        attackBonus: 0,
        attack: 10,
        baseDefense: 5,
        defenseBonus: 0,
        defense: 5,
        baseSpeed: 3,
        speedBonus: 0,
        speed: 3,
        actionsRemaining: 1,
        ...overrides,
    });

    describe('createSession', () => {
        it('should create session successfully', () => {
            const data: CreateSessionDto = {
                gameId: GAME_ID,
                maxPlayers: MAX_PLAYERS,
                player: createMockPlayerDto(),
            };
            const players = [createMockPlayer()];

            sessionService.createSession.mockReturnValue(SESSION_ID);
            sessionService.getPlayersSession.mockReturnValue(players);

            gateway.createSession(mockSocket, data);

            expect(sessionService.createSession).toHaveBeenCalledWith(SOCKET_ID, data);
            expect(mockSocket.join).toHaveBeenCalledWith(SESSION_ID);
            expect(sessionService.getPlayersSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SessionEvents.SessionCreated,
                expect.objectContaining({
                    success: true,
                    data: { sessionId: SESSION_ID, playerId: SOCKET_ID },
                }),
            );
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SessionEvents.SessionPlayersUpdated,
                expect.objectContaining({
                    success: true,
                    data: { players },
                }),
            );
            expect(mockServer.emit).toHaveBeenCalled();
        });

        it('should handle error when creating session', () => {
            const data: CreateSessionDto = {
                gameId: GAME_ID,
                maxPlayers: MAX_PLAYERS,
                player: createMockPlayerDto(),
            };
            const errorMessage = 'Session creation failed';

            sessionService.createSession.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.createSession(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                NotificationEvents.ErrorMessage,
                expect.objectContaining({
                    success: false,
                    message: errorMessage,
                }),
            );
        });
    });

    describe('joinSession', () => {
        const data: JoinSessionDto = {
            sessionId: SESSION_ID,
            player: createMockPlayerDto(),
        };

        it('should return validation error when room not found', () => {
            gateway.joinSession(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                NotificationEvents.ErrorMessage,
                expect.objectContaining({
                    success: false,
                    message: 'Session non trouvée',
                }),
            );
        });

        it('should return validation error when session is locked', () => {
            const room = new Set<string>([SOCKET_ID]);
            mockServer.sockets.adapter.rooms.set(SESSION_ID, room);
            sessionService.isRoomLocked.mockReturnValue(true);

            gateway.joinSession(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                NotificationEvents.ErrorMessage,
                expect.objectContaining({
                    success: false,
                    message: 'Session est verrouillée',
                }),
            );
        });

        it('should return validation error when session is full', () => {
            const room = new Set<string>([SOCKET_ID]);
            mockServer.sockets.adapter.rooms.set(SESSION_ID, room);
            sessionService.isRoomLocked.mockReturnValue(false);
            sessionService.isSessionFull.mockReturnValue(true);

            gateway.joinSession(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                NotificationEvents.ErrorMessage,
                expect.objectContaining({
                    success: false,
                    message: 'Session est pleine',
                }),
            );
        });

        it('should join session successfully without modified name', () => {
            const room = new Set<string>([SOCKET_ID]);
            mockServer.sockets.adapter.rooms.set(SESSION_ID, room);
            sessionService.isRoomLocked.mockReturnValue(false);
            sessionService.isSessionFull.mockReturnValue(false);
            sessionService.joinSession.mockReturnValue(PLAYER_NAME);
            const session = createMockWaitingSession();
            const players = [createMockPlayer()];

            sessionService.getSession.mockReturnValue(session);
            sessionService.getPlayersSession.mockReturnValue(players);

            gateway.joinSession(mockSocket, data);

            expect(mockSocket.leave).toHaveBeenCalledWith(AVATAR_ROOM_ID);
            expect(mockSocket.join).toHaveBeenCalledWith(SESSION_ID);
            expect(sessionService.joinSession).toHaveBeenCalledWith(SOCKET_ID, data);
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SessionEvents.SessionJoined,
                expect.objectContaining({
                    success: true,
                    data: {
                        gameId: GAME_ID,
                        maxPlayers: MAX_PLAYERS,
                    },
                }),
            );
            expect(mockServer.to).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.emit).toHaveBeenCalled();
        });

        it('should join session successfully with modified name', () => {
            const room = new Set<string>([SOCKET_ID]);
            mockServer.sockets.adapter.rooms.set(SESSION_ID, room);
            sessionService.isRoomLocked.mockReturnValue(false);
            sessionService.isSessionFull.mockReturnValue(false);
            sessionService.joinSession.mockReturnValue(MODIFIED_PLAYER_NAME);
            const session = createMockWaitingSession();
            const players = [createMockPlayer()];

            sessionService.getSession.mockReturnValue(session);
            sessionService.getPlayersSession.mockReturnValue(players);

            gateway.joinSession(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                SessionEvents.SessionJoined,
                expect.objectContaining({
                    success: true,
                    data: {
                        gameId: GAME_ID,
                        maxPlayers: MAX_PLAYERS,
                        modifiedPlayerName: MODIFIED_PLAYER_NAME,
                    },
                }),
            );
        });
    });

    describe('joinAvatarSelection', () => {
        const data: JoinAvatarSelectionDto = {
            sessionId: SESSION_ID,
        };

        it('should return validation error when room not found', () => {
            gateway.joinAvatarSelection(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                NotificationEvents.ErrorMessage,
                expect.objectContaining({
                    success: false,
                    message: 'Session non trouvée',
                }),
            );
        });

        it('should join avatar selection successfully', () => {
            const room = new Set<string>([SOCKET_ID]);
            mockServer.sockets.adapter.rooms.set(SESSION_ID, room);
            sessionService.isRoomLocked.mockReturnValue(false);
            sessionService.isSessionFull.mockReturnValue(false);
            const avatarAssignments = [];

            sessionService.getChosenAvatars.mockReturnValue(avatarAssignments);

            gateway.joinAvatarSelection(mockSocket, data);

            expect(mockSocket.join).toHaveBeenCalledWith(AVATAR_ROOM_ID);
            expect(sessionService.getChosenAvatars).toHaveBeenCalledWith(SESSION_ID);
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SessionEvents.AvatarSelectionJoined,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: SOCKET_ID,
                        sessionId: SESSION_ID,
                    },
                }),
            );
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SessionEvents.AvatarAssignmentsUpdated,
                expect.objectContaining({
                    success: true,
                    data: { avatarAssignments },
                }),
            );
        });
    });

    describe('leaveAvatarSelection', () => {
        const data: JoinAvatarSelectionDto = {
            sessionId: SESSION_ID,
        };

        it('should leave avatar selection successfully', () => {
            const avatarAssignments = [];

            sessionService.getChosenAvatars.mockReturnValue(avatarAssignments);

            gateway.leaveAvatarSelection(mockSocket, data);

            expect(mockSocket.leave).toHaveBeenCalledWith(AVATAR_ROOM_ID);
            expect(sessionService.releaseAvatar).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID);
            expect(sessionService.getChosenAvatars).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(AVATAR_ROOM_ID);
        });
    });

    describe('updateAvatarAssignments', () => {
        const data: UpdateAvatarAssignmentsDto = {
            sessionId: SESSION_ID,
            avatar: Avatar.Avatar2,
        };

        it('should update avatar assignments successfully', () => {
            const avatarAssignments = [];

            sessionService.getChosenAvatars.mockReturnValue(avatarAssignments);

            gateway.updateAvatarAssignments(mockSocket, data);

            expect(sessionService.chooseAvatar).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID, Avatar.Avatar2);
            expect(sessionService.getChosenAvatars).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(AVATAR_ROOM_ID);
        });
    });

    describe('lockSession', () => {
        it('should lock session successfully', () => {
            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);

            gateway.lockSession(mockSocket);

            expect(sessionService.getPlayerSessionId).toHaveBeenCalledWith(SOCKET_ID);
            expect(sessionService.lock).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('unlockSession', () => {
        it('should unlock session successfully', () => {
            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);

            gateway.unlockSession(mockSocket);

            expect(sessionService.getPlayerSessionId).toHaveBeenCalledWith(SOCKET_ID);
            expect(sessionService.unlock).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('kickPlayer', () => {
        const data: KickPlayerDto = {
            playerId: 'kicked-player-id',
        };

        it('should kick player successfully with kicked socket', () => {
            const kickedSocket = createMockSocket('kicked-player-id');
            const players = [createMockPlayer()];
            const avatarAssignments = [];

            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            mockServer.sockets.sockets.set('kicked-player-id', kickedSocket);
            sessionService.getPlayersSession.mockReturnValue(players);
            sessionService.getChosenAvatars.mockReturnValue(avatarAssignments);

            gateway.kickPlayer(mockSocket, data);

            expect(sessionService.kickPlayer).toHaveBeenCalledWith(SESSION_ID, 'kicked-player-id');
            expect(kickedSocket.leave).toHaveBeenCalledWith(SESSION_ID);
            expect(kickedSocket.emit).toHaveBeenCalledWith(
                SessionEvents.SessionEnded,
                expect.objectContaining({
                    success: true,
                    data: { message: 'Vous avez été exclu de la session' },
                }),
            );
            expect(mockServer.to).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.emit).toHaveBeenCalled();
        });

        it('should kick player successfully without kicked socket', () => {
            const players = [createMockPlayer()];
            const avatarAssignments = [];

            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.getPlayersSession.mockReturnValue(players);
            sessionService.getChosenAvatars.mockReturnValue(avatarAssignments);

            gateway.kickPlayer(mockSocket, data);

            expect(sessionService.kickPlayer).toHaveBeenCalledWith(SESSION_ID, 'kicked-player-id');
            expect(mockServer.to).toHaveBeenCalled();
        });

        it('should handle error when kicking player', () => {
            const errorMessage = 'Kick failed';
            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.kickPlayer.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.kickPlayer(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                NotificationEvents.ErrorMessage,
                expect.objectContaining({
                    success: false,
                    message: errorMessage,
                }),
            );
        });
    });

    describe('startGameSession', () => {
        it('should return error when player not in session', async () => {
            sessionService.getPlayerSessionId.mockReturnValue(null);

            await gateway.startGameSession(mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                NotificationEvents.ErrorMessage,
                expect.objectContaining({
                    success: false,
                    message: 'Joueur non connecté à une session',
                }),
            );
        });

        it('should return error when session not found', async () => {
            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.getSession.mockReturnValue(null);

            await gateway.startGameSession(mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                NotificationEvents.ErrorMessage,
                expect.objectContaining({
                    success: false,
                    message: 'Session introuvable',
                }),
            );
        });

        it('should return error when creating in-game session fails', async () => {
            const waitingSession = createMockWaitingSession();
            const errorMessage = 'Failed to create in-game session';

            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.getSession.mockReturnValue(waitingSession);
            inGameService.createInGameSession.mockRejectedValue(new Error(errorMessage));

            await gateway.startGameSession(mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                NotificationEvents.ErrorMessage,
                expect.objectContaining({
                    success: false,
                    message: errorMessage,
                }),
            );
        });

        it('should start game session successfully', async () => {
            const waitingSession = createMockWaitingSession();
            const players = [createMockPlayer({ id: SOCKET_ID }), createMockPlayer({ id: 'player-2' })];
            const inGameSession = {
                inGameId: IN_GAME_ID,
            };

            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.getSession.mockReturnValue(waitingSession);
            inGameService.createInGameSession.mockResolvedValue(inGameSession as never);
            sessionService.getPlayersSession.mockReturnValue(players);

            const playerSocket1 = createMockSocket(SOCKET_ID);
            const playerSocket2 = createMockSocket('player-2');
            mockServer.sockets.sockets.set(SOCKET_ID, playerSocket1);
            mockServer.sockets.sockets.set('player-2', playerSocket2);

            await gateway.startGameSession(mockSocket);

            expect(inGameService.createInGameSession).toHaveBeenCalledWith(waitingSession, GameMode.CLASSIC, MapSize.SMALL);
            expect(playerSocket1.join).toHaveBeenCalledWith(IN_GAME_ID);
            expect(playerSocket2.join).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.to).toHaveBeenCalledWith(SESSION_ID);
            expect(playerSocket1.leave).toHaveBeenCalledWith(SESSION_ID);
            expect(playerSocket2.leave).toHaveBeenCalledWith(SESSION_ID);
            expect(sessionService.endSession).toHaveBeenCalledWith(SESSION_ID);
        });

        it('should handle missing player socket when starting game', async () => {
            const waitingSession = createMockWaitingSession();
            const players = [createMockPlayer({ id: SOCKET_ID }), createMockPlayer({ id: 'player-2' })];
            const inGameSession = {
                inGameId: IN_GAME_ID,
            };

            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.getSession.mockReturnValue(waitingSession);
            inGameService.createInGameSession.mockResolvedValue(inGameSession as never);
            sessionService.getPlayersSession.mockReturnValue(players);

            await gateway.startGameSession(mockSocket);

            expect(sessionService.endSession).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('leaveSession', () => {
        it('should return early when no sessionId', () => {
            sessionService.getPlayerSessionId.mockReturnValue(null);

            gateway.leaveSession(mockSocket);

            expect(sessionService.getSession).not.toHaveBeenCalled();
        });

        it('should handle error when leaving session', () => {
            const errorMessage = 'Leave failed';
            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.getSession.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            expect(() => {
                gateway.leaveSession(mockSocket);
            }).toThrow(errorMessage);
        });

        it('should leave session as admin successfully', () => {
            const session = createMockWaitingSession({
                players: [createMockPlayer({ id: SOCKET_ID }), createMockPlayer({ id: 'player-2' })],
            });

            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.getSession.mockReturnValue(session);
            sessionService.isAdmin.mockReturnValue(true);

            const playerSocket2 = createMockSocket('player-2');
            mockServer.sockets.sockets.set('player-2', playerSocket2);

            gateway.leaveSession(mockSocket);

            expect(mockSocket.broadcast.to).toHaveBeenCalledWith(SESSION_ID);
            expect(playerSocket2.leave).toHaveBeenCalledWith(SESSION_ID);
            expect(sessionService.releaseAvatar).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID);
            expect(sessionService.releaseAvatar).toHaveBeenCalledWith(SESSION_ID, 'player-2');
            expect(sessionService.endSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.emit).toHaveBeenCalled();
        });

        it('should leave session as admin with missing player sockets', () => {
            const session = createMockWaitingSession({
                players: [createMockPlayer({ id: SOCKET_ID }), createMockPlayer({ id: 'player-2' })],
            });

            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.getSession.mockReturnValue(session);
            sessionService.isAdmin.mockReturnValue(true);

            gateway.leaveSession(mockSocket);

            expect(sessionService.endSession).toHaveBeenCalledWith(SESSION_ID);
        });

        it('should leave session as non-admin successfully', () => {
            const session = createMockWaitingSession();
            const players = [createMockPlayer()];
            const avatarAssignments = [];

            sessionService.getPlayerSessionId.mockReturnValue(SESSION_ID);
            sessionService.getSession.mockReturnValue(session);
            sessionService.isAdmin.mockReturnValue(false);
            sessionService.getPlayersSession.mockReturnValue(players);
            sessionService.getChosenAvatars.mockReturnValue(avatarAssignments);

            gateway.leaveSession(mockSocket);

            expect(mockSocket.leave).toHaveBeenCalledWith(SESSION_ID);
            expect(sessionService.leaveSession).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID);
            expect(mockServer.to).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.emit).toHaveBeenCalled();
        });
    });

    describe('handleDisconnect', () => {
        it('should call leaveSession when disconnecting', () => {
            const leaveSessionSpy = jest.spyOn(gateway, 'leaveSession').mockImplementation();

            gateway.handleDisconnect(mockSocket);

            expect(leaveSessionSpy).toHaveBeenCalledWith(mockSocket);
        });
    });

    describe('loadAvailableSessions', () => {
        it('should load and emit available sessions', () => {
            const sessions = [];

            sessionService.getAvailableSessions.mockReturnValue(sessions);

            gateway.loadAvailableSessions(mockSocket);

            expect(sessionService.getAvailableSessions).toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SessionEvents.AvailableSessionsUpdated,
                expect.objectContaining({
                    success: true,
                    data: { sessions },
                }),
            );
        });
    });

    describe('handleAvailabilityChange', () => {
        it('should emit available sessions to all clients', () => {
            const sessions = [];

            sessionService.getAvailableSessions.mockReturnValue(sessions);

            gateway.handleAvailabilityChange();

            expect(sessionService.getAvailableSessions).toHaveBeenCalled();
            expect(mockServer.emit).toHaveBeenCalledWith(
                SessionEvents.AvailableSessionsUpdated,
                expect.objectContaining({
                    success: true,
                    data: { sessions },
                }),
            );
        });
    });

    describe('handleAutoLocked', () => {
        it('should emit session auto-locked event to session room', () => {
            gateway.handleAutoLocked(SESSION_ID);

            expect(mockServer.to).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('getRoom', () => {
        it('should return room when it exists', () => {
            const room = new Set<string>([SOCKET_ID]);
            mockServer.sockets.adapter.rooms.set(SESSION_ID, room);

            type GatewayWithPrivateMethod = {
                getRoom: (accessCode: string) => Set<string> | undefined;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            const result = gatewayPrivate.getRoom(SESSION_ID);

            expect(result).toBe(room);
        });

        it('should return undefined when room does not exist', () => {
            type GatewayWithPrivateMethod = {
                getRoom: (accessCode: string) => Set<string> | undefined;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            const result = gatewayPrivate.getRoom('non-existent');

            expect(result).toBeUndefined();
        });
    });

    describe('validateSessionJoin', () => {
        it('should return error when room not found', () => {
            type GatewayWithPrivateMethod = {
                validateSessionJoin: (sessionId: string) => { success: boolean; message: string } | null;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            const result = gatewayPrivate.validateSessionJoin(SESSION_ID);

            expect(result).toEqual(
                expect.objectContaining({
                    success: false,
                    message: 'Session non trouvée',
                }),
            );
        });

        it('should return error when session is locked', () => {
            const room = new Set<string>([SOCKET_ID]);
            mockServer.sockets.adapter.rooms.set(SESSION_ID, room);
            sessionService.isRoomLocked.mockReturnValue(true);

            type GatewayWithPrivateMethod = {
                validateSessionJoin: (sessionId: string) => { success: boolean; message: string } | null;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            const result = gatewayPrivate.validateSessionJoin(SESSION_ID);

            expect(result).toEqual(
                expect.objectContaining({
                    success: false,
                    message: 'Session est verrouillée',
                }),
            );
        });

        it('should return error when session is full', () => {
            const room = new Set<string>([SOCKET_ID]);
            mockServer.sockets.adapter.rooms.set(SESSION_ID, room);
            sessionService.isRoomLocked.mockReturnValue(false);
            sessionService.isSessionFull.mockReturnValue(true);

            type GatewayWithPrivateMethod = {
                validateSessionJoin: (sessionId: string) => { success: boolean; message: string } | null;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            const result = gatewayPrivate.validateSessionJoin(SESSION_ID);

            expect(result).toEqual(
                expect.objectContaining({
                    success: false,
                    message: 'Session est pleine',
                }),
            );
        });

        it('should return null when validation passes', () => {
            const room = new Set<string>([SOCKET_ID]);
            mockServer.sockets.adapter.rooms.set(SESSION_ID, room);
            sessionService.isRoomLocked.mockReturnValue(false);
            sessionService.isSessionFull.mockReturnValue(false);

            type GatewayWithPrivateMethod = {
                validateSessionJoin: (sessionId: string) => { success: boolean; message: string } | null;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            const result = gatewayPrivate.validateSessionJoin(SESSION_ID);

            expect(result).toBeNull();
        });
    });

    describe('handleJoinSession', () => {
        it('should handle join session and return modified name', () => {
            const data: JoinSessionDto = {
                sessionId: SESSION_ID,
                player: createMockPlayerDto(),
            };

            sessionService.joinSession.mockReturnValue(MODIFIED_PLAYER_NAME);

            type GatewayWithPrivateMethod = {
                handleJoinSession: (socket: Socket, data: JoinSessionDto) => string;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            const result = gatewayPrivate.handleJoinSession(mockSocket, data);

            expect(mockSocket.leave).toHaveBeenCalledWith(AVATAR_ROOM_ID);
            expect(mockSocket.join).toHaveBeenCalledWith(SESSION_ID);
            expect(sessionService.joinSession).toHaveBeenCalledWith(SOCKET_ID, data);
            expect(result).toBe(MODIFIED_PLAYER_NAME);
        });
    });

    describe('getAvatarSelectionRoomId', () => {
        it('should return correct avatar selection room ID', () => {
            type GatewayWithPrivateMethod = {
                getAvatarSelectionRoomId: (sessionId: string) => string;
            };
            const gatewayPrivate = gateway as unknown as GatewayWithPrivateMethod;

            const result = gatewayPrivate.getAvatarSelectionRoomId(SESSION_ID);

            expect(result).toBe(AVATAR_ROOM_ID);
        });
    });
});
