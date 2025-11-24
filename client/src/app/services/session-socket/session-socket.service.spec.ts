import { TestBed } from '@angular/core/testing';
import { AddVirtualPlayerDto } from '@app/dto/add-virtual-player-dto';
import { AvailableSessionsUpdatedDto } from '@app/dto/available-sessions-updated-dto';
import { AvatarAssignmentDto } from '@app/dto/avatar-assignment-dto';
import { AvatarAssignmentsUpdatedDto } from '@app/dto/avatar-assignments-updated-dto';
import { AvatarSelectionJoinedDto } from '@app/dto/avatar-selection-joined-dto';
import { CreateSessionDto } from '@app/dto/create-session-dto';
import { JoinAvatarSelectionDto } from '@app/dto/join-avatar-selection-dto';
import { JoinSessionDto } from '@app/dto/join-session-dto';
import { KickPlayerDto } from '@app/dto/kick-player-dto';
import { PlayerDto } from '@app/dto/player-dto';
import { SessionCreatedDto } from '@app/dto/session-created-dto';
import { SessionJoinedDto } from '@app/dto/session-joined-dto';
import { SessionPlayersUpdatedDto } from '@app/dto/session-players-updated-dto';
import { SessionPreviewDto } from '@app/dto/session-preview-dto';
import { UpdateAvatarAssignmentsDto } from '@app/dto/update-avatar-assignments-dto';
import { SocketService } from '@app/services/socket/socket.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { SessionEvents } from '@common/enums/session-events.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { SessionSocketService } from './session-socket.service';

// Test constants
const TEST_SESSION_ID = 'test-session-id';
const TEST_SESSION_ID_2 = 'test-session-id-2';
const TEST_GAME_ID = 'test-game-id';
const TEST_PLAYER_ID = 'test-player-id';
const TEST_PLAYER_ID_2 = 'test-player-id-2';
const TEST_CHAT_ID = 'test-chat-id';
const TEST_PLAYER_NAME = 'Test Player';
const TEST_MAX_PLAYERS = 4;
const TEST_MAX_PLAYERS_2 = 6;
const TEST_GAME_NAME = 'Test Game';
const TEST_GAME_DESCRIPTION = 'Test Description';
const TEST_CURRENT_PLAYERS = 2;
const TEST_AVATAR_STRING = 'Avatar1';
const TEST_MESSAGE = 'Session ended message';
const TEST_MODIFIED_PLAYER_NAME = 'Modified Player Name';
const EMPTY_OBJECT = {};
const TEST_BASE_HEALTH = 4;
const TEST_HEALTH_BONUS = 0;
const TEST_HEALTH = 4;
const TEST_MAX_HEALTH = 4;
const TEST_BASE_ATTACK = 4;
const TEST_ATTACK_BONUS = 0;
const TEST_BASE_DEFENSE = 4;
const TEST_DEFENSE_BONUS = 0;
const TEST_BASE_SPEED = 3;
const TEST_SPEED_BONUS = 0;
const TEST_SPEED = 3;
const TEST_BOAT_SPEED_BONUS = 0;
const TEST_BOAT_SPEED = 3;
const TEST_ACTIONS_REMAINING = 1;
const TEST_HAS_COMBAT_BONUS = false;
const TEST_IS_NOT_ADMIN = false;

type MockSocketService = {
    emit: jasmine.Spy;
    onSuccessEvent: jasmine.Spy;
};

const createMockPlayerDto = (): PlayerDto => ({
    id: TEST_PLAYER_ID,
    name: TEST_PLAYER_NAME,
    avatar: Avatar.Avatar1,
    isAdmin: TEST_IS_NOT_ADMIN,
    attackDice: Dice.D6,
    defenseDice: Dice.D6,
    baseHealth: TEST_BASE_HEALTH,
    healthBonus: TEST_HEALTH_BONUS,
    health: TEST_HEALTH,
    maxHealth: TEST_MAX_HEALTH,
    baseAttack: TEST_BASE_ATTACK,
    attackBonus: TEST_ATTACK_BONUS,
    baseDefense: TEST_BASE_DEFENSE,
    defenseBonus: TEST_DEFENSE_BONUS,
    baseSpeed: TEST_BASE_SPEED,
    speedBonus: TEST_SPEED_BONUS,
    speed: TEST_SPEED,
    actionsRemaining: TEST_ACTIONS_REMAINING,
    hasCombatBonus: TEST_HAS_COMBAT_BONUS,
    boatSpeedBonus: TEST_BOAT_SPEED_BONUS,
    boatSpeed: TEST_BOAT_SPEED,
});

const createMockCreateSessionDto = (): CreateSessionDto => ({
    gameId: TEST_GAME_ID,
    maxPlayers: TEST_MAX_PLAYERS,
    mode: GameMode.CLASSIC,
    player: createMockPlayerDto(),
});

const createMockJoinAvatarSelectionDto = (): JoinAvatarSelectionDto => ({
    sessionId: TEST_SESSION_ID,
});

const createMockJoinSessionDto = (): JoinSessionDto => ({
    sessionId: TEST_SESSION_ID,
    player: createMockPlayerDto(),
});

const createMockKickPlayerDto = (): KickPlayerDto => ({
    playerId: TEST_PLAYER_ID,
});

const createMockAddVirtualPlayerDto = (): AddVirtualPlayerDto => ({
    sessionId: TEST_SESSION_ID,
    virtualPlayerType: VirtualPlayerType.Offensive,
});

const createMockUpdateAvatarAssignmentsDto = (): UpdateAvatarAssignmentsDto => ({
    sessionId: TEST_SESSION_ID,
    avatar: TEST_AVATAR_STRING,
});

const createMockSessionCreatedDto = (): SessionCreatedDto => ({
    sessionId: TEST_SESSION_ID,
    playerId: TEST_PLAYER_ID,
    chatId: TEST_CHAT_ID,
});

const createMockAvatarSelectionJoinedDto = (): AvatarSelectionJoinedDto => ({
    playerId: TEST_PLAYER_ID,
    sessionId: TEST_SESSION_ID,
});

const createMockSessionJoinedDto = (): SessionJoinedDto => ({
    gameId: TEST_GAME_ID,
    maxPlayers: TEST_MAX_PLAYERS,
    chatId: TEST_CHAT_ID,
    mode: GameMode.CLASSIC,
});

const createMockAvatarAssignmentDto = (): AvatarAssignmentDto => ({
    avatar: Avatar.Avatar1,
    chosenBy: TEST_PLAYER_ID,
});

const createMockAvatarAssignmentsUpdatedDto = (): AvatarAssignmentsUpdatedDto => ({
    avatarAssignments: [createMockAvatarAssignmentDto()],
});

const createMockSessionPlayersUpdatedDto = (): SessionPlayersUpdatedDto => ({
    players: [createMockPlayerDto()],
});

const createMockSessionPreviewDto = (): SessionPreviewDto => ({
    id: TEST_SESSION_ID,
    currentPlayers: TEST_CURRENT_PLAYERS,
    maxPlayers: TEST_MAX_PLAYERS,
    gameName: TEST_GAME_NAME,
    gameDescription: TEST_GAME_DESCRIPTION,
    mapSize: MapSize.MEDIUM,
    gameMode: GameMode.CLASSIC,
});

const createMockAvailableSessionsUpdatedDto = (): AvailableSessionsUpdatedDto => ({
    sessions: [createMockSessionPreviewDto()],
});

describe('SessionSocketService', () => {
    let service: SessionSocketService;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = {
            emit: jasmine.createSpy('emit'),
            onSuccessEvent: jasmine.createSpy('onSuccessEvent'),
        };

        TestBed.configureTestingModule({
            providers: [SessionSocketService, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(SessionSocketService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('createSession', () => {
        it('should call socket.emit with CreateSession event and data', () => {
            const data = createMockCreateSessionDto();

            service.createSession(data);

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.CreateSession, data);
        });

        it('should call socket.emit with different CreateSession data', () => {
            const differentData: CreateSessionDto = {
                gameId: 'different-game-id',
                maxPlayers: TEST_MAX_PLAYERS_2,
                mode: GameMode.CTF,
                player: createMockPlayerDto(),
            };

            service.createSession(differentData);

            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.CreateSession, differentData);
        });
    });

    describe('joinAvatarSelection', () => {
        it('should call socket.emit with JoinAvatarSelection event and data', () => {
            const data = createMockJoinAvatarSelectionDto();

            service.joinAvatarSelection(data);

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.JoinAvatarSelection, data);
        });

        it('should call socket.emit with different JoinAvatarSelection data', () => {
            const differentData: JoinAvatarSelectionDto = {
                sessionId: TEST_SESSION_ID_2,
            };

            service.joinAvatarSelection(differentData);

            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.JoinAvatarSelection, differentData);
        });
    });

    describe('leaveAvatarSelection', () => {
        it('should call socket.emit with LeaveAvatarSelection event and data', () => {
            const data = createMockJoinAvatarSelectionDto();

            service.leaveAvatarSelection(data);

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.LeaveAvatarSelection, data);
        });

        it('should call socket.emit with different LeaveAvatarSelection data', () => {
            const differentData: JoinAvatarSelectionDto = {
                sessionId: TEST_SESSION_ID_2,
            };

            service.leaveAvatarSelection(differentData);

            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.LeaveAvatarSelection, differentData);
        });
    });

    describe('joinSession', () => {
        it('should call socket.emit with JoinSession event and data', () => {
            const data = createMockJoinSessionDto();

            service.joinSession(data);

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.JoinSession, data);
        });

        it('should call socket.emit with different JoinSession data', () => {
            const differentData: JoinSessionDto = {
                sessionId: TEST_SESSION_ID_2,
                player: createMockPlayerDto(),
            };

            service.joinSession(differentData);

            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.JoinSession, differentData);
        });
    });

    describe('leaveSession', () => {
        it('should call socket.emit with LeaveSession event and empty object', () => {
            service.leaveSession();

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.LeaveSession, EMPTY_OBJECT);
        });
    });

    describe('startGameSession', () => {
        it('should call socket.emit with StartGameSession event and empty object', () => {
            service.startGameSession();

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.StartGameSession, EMPTY_OBJECT);
        });
    });

    describe('lockSession', () => {
        it('should call socket.emit with LockSession event and empty object', () => {
            service.lockSession();

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.LockSession, EMPTY_OBJECT);
        });
    });

    describe('unlockSession', () => {
        it('should call socket.emit with UnlockSession event and empty object', () => {
            service.unlockSession();

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.UnlockSession, EMPTY_OBJECT);
        });
    });

    describe('kickPlayer', () => {
        it('should call socket.emit with KickPlayer event and data', () => {
            const data = createMockKickPlayerDto();

            service.kickPlayer(data);

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.KickPlayer, data);
        });

        it('should call socket.emit with different KickPlayer data', () => {
            const differentData: KickPlayerDto = {
                playerId: TEST_PLAYER_ID_2,
            };

            service.kickPlayer(differentData);

            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.KickPlayer, differentData);
        });
    });

    describe('addVirtualPlayer', () => {
        it('should call socket.emit with AddVirtualPlayer event and data', () => {
            const data = createMockAddVirtualPlayerDto();

            service.addVirtualPlayer(data);

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.AddVirtualPlayer, data);
        });

        it('should call socket.emit with different AddVirtualPlayer data', () => {
            const differentData: AddVirtualPlayerDto = {
                sessionId: TEST_SESSION_ID_2,
                virtualPlayerType: VirtualPlayerType.Defensive,
            };

            service.addVirtualPlayer(differentData);

            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.AddVirtualPlayer, differentData);
        });
    });

    describe('updateAvatarsAssignment', () => {
        it('should call socket.emit with UpdateAvatarAssignments event and data', () => {
            const data = createMockUpdateAvatarAssignmentsDto();

            service.updateAvatarsAssignment(data);

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.UpdateAvatarAssignments, data);
        });

        it('should call socket.emit with different UpdateAvatarAssignments data', () => {
            const differentData: UpdateAvatarAssignmentsDto = {
                sessionId: TEST_SESSION_ID_2,
                avatar: 'Avatar2',
            };

            service.updateAvatarsAssignment(differentData);

            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.UpdateAvatarAssignments, differentData);
        });
    });

    describe('loadAvailableSessions', () => {
        it('should call socket.emit with LoadAvailableSessions event and empty object', () => {
            service.loadAvailableSessions();

            expect(mockSocketService.emit).toHaveBeenCalledTimes(1);
            expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.LoadAvailableSessions, EMPTY_OBJECT);
        });
    });

    describe('onSessionCreated', () => {
        it('should call socket.onSuccessEvent with SessionCreated event', () => {
            const callback = jasmine.createSpy('callback');

            service.onSessionCreated(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionCreated, callback);
        });

        it('should invoke callback with session created data when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: SessionCreatedDto) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: (data: SessionCreatedDto) => void) => {
                eventCallback = cb;
            });

            service.onSessionCreated(callback);

            const data = createMockSessionCreatedDto();
            if (eventCallback) {
                eventCallback(data);
            }

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(data);
        });
    });

    describe('onAvatarSelectionJoined', () => {
        it('should call socket.onSuccessEvent with AvatarSelectionJoined event', () => {
            const callback = jasmine.createSpy('callback');

            service.onAvatarSelectionJoined(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.AvatarSelectionJoined, callback);
        });

        it('should invoke callback with avatar selection joined data when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: AvatarSelectionJoinedDto) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: (data: AvatarSelectionJoinedDto) => void) => {
                eventCallback = cb;
            });

            service.onAvatarSelectionJoined(callback);

            const data = createMockAvatarSelectionJoinedDto();
            if (eventCallback) {
                eventCallback(data);
            }

            expect(callback).toHaveBeenCalledWith(data);
        });
    });

    describe('onSessionJoined', () => {
        it('should call socket.onSuccessEvent with SessionJoined event', () => {
            const callback = jasmine.createSpy('callback');

            service.onSessionJoined(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionJoined, callback);
        });

        it('should invoke callback with session joined data when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: SessionJoinedDto) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: (data: SessionJoinedDto) => void) => {
                eventCallback = cb;
            });

            service.onSessionJoined(callback);

            const data = createMockSessionJoinedDto();
            if (eventCallback) {
                eventCallback(data);
            }

            expect(callback).toHaveBeenCalledWith(data);
        });

        it('should invoke callback with session joined data including modifiedPlayerName', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: SessionJoinedDto) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: (data: SessionJoinedDto) => void) => {
                eventCallback = cb;
            });

            service.onSessionJoined(callback);

            const data: SessionJoinedDto = {
                ...createMockSessionJoinedDto(),
                modifiedPlayerName: TEST_MODIFIED_PLAYER_NAME,
            };
            if (eventCallback) {
                eventCallback(data);
            }

            expect(callback).toHaveBeenCalledWith(data);
        });
    });

    describe('onSessionEnded', () => {
        it('should call socket.onSuccessEvent with SessionEnded event', () => {
            const callback = jasmine.createSpy('callback');

            service.onSessionEnded(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionEnded, jasmine.any(Function));
        });

        it('should invoke callback with message when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: { message: string }) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: (data: { message: string }) => void) => {
                eventCallback = cb;
            });

            service.onSessionEnded(callback);

            const data = { message: TEST_MESSAGE };
            if (eventCallback) {
                eventCallback(data);
            }

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(TEST_MESSAGE);
        });

        it('should invoke callback with different message', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: { message: string }) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: (data: { message: string }) => void) => {
                eventCallback = cb;
            });

            service.onSessionEnded(callback);

            const differentMessage = 'Different message';
            const data = { message: differentMessage };
            if (eventCallback) {
                eventCallback(data);
            }

            expect(callback).toHaveBeenCalledWith(differentMessage);
        });
    });

    describe('onAvatarAssignmentsUpdated', () => {
        it('should call socket.onSuccessEvent with AvatarAssignmentsUpdated event', () => {
            const callback = jasmine.createSpy('callback');

            service.onAvatarAssignmentsUpdated(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.AvatarAssignmentsUpdated, callback);
        });

        it('should invoke callback with avatar assignments updated data when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: AvatarAssignmentsUpdatedDto) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: (data: AvatarAssignmentsUpdatedDto) => void) => {
                eventCallback = cb;
            });

            service.onAvatarAssignmentsUpdated(callback);

            const data = createMockAvatarAssignmentsUpdatedDto();
            if (eventCallback) {
                eventCallback(data);
            }

            expect(callback).toHaveBeenCalledWith(data);
        });
    });

    describe('onSessionPlayersUpdated', () => {
        it('should call socket.onSuccessEvent with SessionPlayersUpdated event', () => {
            const callback = jasmine.createSpy('callback');

            service.onSessionPlayersUpdated(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionPlayersUpdated, callback);
        });

        it('should invoke callback with session players updated data when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: SessionPlayersUpdatedDto) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: (data: SessionPlayersUpdatedDto) => void) => {
                eventCallback = cb;
            });

            service.onSessionPlayersUpdated(callback);

            const data = createMockSessionPlayersUpdatedDto();
            if (eventCallback) {
                eventCallback(data);
            }

            expect(callback).toHaveBeenCalledWith(data);
        });
    });

    describe('onGameSessionStarted', () => {
        it('should call socket.onSuccessEvent with GameSessionStarted event', () => {
            const callback = jasmine.createSpy('callback');

            service.onGameSessionStarted(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.GameSessionStarted, callback);
        });

        it('should invoke callback when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: (() => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: () => void) => {
                eventCallback = cb;
            });

            service.onGameSessionStarted(callback);

            if (eventCallback) {
                eventCallback();
            }

            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('onAvailableSessionsUpdated', () => {
        it('should call socket.onSuccessEvent with AvailableSessionsUpdated event', () => {
            const callback = jasmine.createSpy('callback');

            service.onAvailableSessionsUpdated(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.AvailableSessionsUpdated, callback);
        });

        it('should invoke callback with available sessions updated data when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: ((data: AvailableSessionsUpdatedDto) => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: (data: AvailableSessionsUpdatedDto) => void) => {
                eventCallback = cb;
            });

            service.onAvailableSessionsUpdated(callback);

            const data = createMockAvailableSessionsUpdatedDto();
            if (eventCallback) {
                eventCallback(data);
            }

            expect(callback).toHaveBeenCalledWith(data);
        });
    });

    describe('onSessionAutoLocked', () => {
        it('should call socket.onSuccessEvent with SessionAutoLocked event', () => {
            const callback = jasmine.createSpy('callback');

            service.onSessionAutoLocked(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionAutoLocked, callback);
        });

        it('should invoke callback when event is received', () => {
            const callback = jasmine.createSpy('callback');
            let eventCallback: (() => void) | undefined;

            mockSocketService.onSuccessEvent.and.callFake((event: SessionEvents, cb: () => void) => {
                eventCallback = cb;
            });

            service.onSessionAutoLocked(callback);

            if (eventCallback) {
                eventCallback();
            }

            expect(callback).toHaveBeenCalledTimes(1);
        });
    });
});

