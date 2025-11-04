import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { ROUTES } from '@app/enums/routes.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';

describe('SessionService', () => {
    let service: SessionService;
    let mockSessionSocketService: jasmine.SpyObj<SessionSocketService>;
    let mockNotificationService: jasmine.SpyObj<NotificationCoordinatorService>;
    let mockRouter: jasmine.SpyObj<Router>;

    const mockPlayer: Player = {
        id: 'player1',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isAdmin: true,
        baseHealth: 4,
        healthBonus: 0,
        health: 4,
        maxHealth: 4,
        baseSpeed: 3,
        speedBonus: 0,
        speed: 3,
        baseAttack: 4,
        attackBonus: 0,
        attack: 4,
        baseDefense: 4,
        defenseBonus: 0,
        defense: 4,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: 0,
        y: 0,
        isInGame: false,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
    };

    beforeEach(() => {
        mockSessionSocketService = jasmine.createSpyObj('SessionSocketService', [
            'lockSession', 'unlockSession', 'updateAvatarsAssignment', 'kickPlayer',
            'leaveSession', 'createSession', 'joinSession', 'startGameSession',
            'joinAvatarSelection', 'leaveAvatarSelection', 'loadAvailableSessions',
            'onAvatarAssignmentsUpdated', 'onSessionPlayersUpdated', 'onGameSessionStarted',
            'onSessionJoined', 'onSessionCreatedError', 'onSessionJoinError',
            'onAvatarSelectionJoinError', 'onAvatarSelectionJoined', 'onAvailableSessionsUpdated',
            'onSessionAutoLocked', 'onStartGameSessionError'
        ]);

        mockNotificationService = jasmine.createSpyObj('NotificationCoordinatorService', ['displayErrorPopup']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                { provide: SessionSocketService, useValue: mockSessionSocketService },
                { provide: NotificationCoordinatorService, useValue: mockNotificationService },
                { provide: Router, useValue: mockRouter },
            ],
        });
        service = TestBed.inject(SessionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Session Management', () => {
        it('should update session', () => {
            service.updateSession({ id: 'test-id' });
            expect(service.id()).toBe('test-id');
        });

        it('should reset session', () => {
            service.updateSession({ id: 'test-id' });
            service.resetSession();
            expect(service.id()).toBe('');
        });

        it('should lock session', () => {
            service.lock();
            expect(service.isRoomLocked()).toBe(true);
            expect(mockSessionSocketService.lockSession).toHaveBeenCalled();
        });

        it('should unlock session', () => {
            service.updateSession({ isRoomLocked: true });
            service.unlock();
            expect(service.isRoomLocked()).toBe(false);
            expect(mockSessionSocketService.unlockSession).toHaveBeenCalled();
        });
    });

    describe('Session State Checks', () => {
        it('should check if can be locked', () => {
            expect(service.canBeLocked()).toBe(true);
            service.updateSession({ isRoomLocked: true });
            expect(service.canBeLocked()).toBe(false);
        });

        it('should check if can be unlocked', () => {
            service.updateSession({ isRoomLocked: true, maxPlayers: 4, players: [mockPlayer] });
            expect(service.canBeUnlocked()).toBe(true);
            
            service.updateSession({ isRoomLocked: false });
            expect(service.canBeUnlocked()).toBe(false);
        });

        it('should check if can start game', () => {
            service.updateSession({ isRoomLocked: true, players: [mockPlayer, mockPlayer] });
            expect(service.canStartGame()).toBe(true);
            
            service.updateSession({ isRoomLocked: false });
            expect(service.canStartGame()).toBe(false);
        });
    });

    describe('Avatar Management', () => {
        it('should update avatar assignment for admin', () => {
            service.updateAvatarAssignment('player1', Avatar.Avatar1, true);
            expect(service.avatarAssignments().some(a => a.chosenBy === 'player1')).toBe(true);
        });

        it('should emit socket event for non-admin', () => {
            service.updateSession({ id: 'session1' });
            service.updateAvatarAssignment('player1', Avatar.Avatar1, false);
            expect(mockSessionSocketService.updateAvatarsAssignment).toHaveBeenCalledWith({
                sessionId: 'session1',
                avatar: Avatar.Avatar1
            });
        });
    });

    describe('Player Actions', () => {
        it('should kick player', () => {
            service.kickPlayer('player1');
            expect(mockSessionSocketService.kickPlayer).toHaveBeenCalledWith({ playerId: 'player1' });
        });

        it('should leave session', () => {
            service.leaveSession();
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.HomePage]);
            expect(mockSessionSocketService.leaveSession).toHaveBeenCalled();
        });
    });

    describe('Session Operations', () => {
        it('should initialize session with game', () => {
            service.initializeSessionWithGame('game1', MapSize.SMALL);
            expect(service.gameId()).toBe('game1');
            expect(service.maxPlayers()).toBe(2);
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.CharacterCreationPage]);
        });

        it('should create session', () => {
            service.updateSession({ gameId: 'game1', maxPlayers: 4 });
            service.createSession(mockPlayer);
            expect(mockSessionSocketService.createSession).toHaveBeenCalledWith({
                gameId: 'game1',
                maxPlayers: 4,
                player: mockPlayer
            });
        });

        it('should join session', () => {
            service.updateSession({ id: 'session1' });
            service.joinSession(mockPlayer);
            expect(mockSessionSocketService.joinSession).toHaveBeenCalledWith({
                sessionId: 'session1',
                player: mockPlayer
            });
        });

        it('should start game session', () => {
            service.startGameSession();
            expect(mockSessionSocketService.startGameSession).toHaveBeenCalled();
        });

        it('should join avatar selection', () => {
            service.joinAvatarSelection('session1');
            expect(mockSessionSocketService.joinAvatarSelection).toHaveBeenCalledWith({ sessionId: 'session1' });
        });

        it('should leave avatar selection', () => {
            service.updateSession({ id: 'session1' });
            service.leaveAvatarSelection();
            expect(mockSessionSocketService.leaveAvatarSelection).toHaveBeenCalledWith({ sessionId: 'session1' });
        });

        it('should load available sessions', () => {
            service.loadAvailableSessions();
            expect(mockSessionSocketService.loadAvailableSessions).toHaveBeenCalled();
        });
    });

    describe('Event Handlers', () => {
        it('should handle session joined', () => {
            service.handleSessionJoined({ gameId: 'game1', maxPlayers: 4 });
            expect(service.gameId()).toBe('game1');
            expect(service.maxPlayers()).toBe(4);
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.WaitingRoomPage]);
        });
    });

    describe('Socket Event Listeners', () => {
        it('should register all socket listeners', () => {
            expect(mockSessionSocketService.onAvatarAssignmentsUpdated).toHaveBeenCalled();
            expect(mockSessionSocketService.onSessionPlayersUpdated).toHaveBeenCalled();
            expect(mockSessionSocketService.onGameSessionStarted).toHaveBeenCalled();
            expect(mockSessionSocketService.onSessionJoined).toHaveBeenCalled();
            expect(mockSessionSocketService.onSessionCreatedError).toHaveBeenCalled();
            expect(mockSessionSocketService.onSessionJoinError).toHaveBeenCalled();
            expect(mockSessionSocketService.onAvatarSelectionJoinError).toHaveBeenCalled();
            expect(mockSessionSocketService.onAvatarSelectionJoined).toHaveBeenCalled();
            expect(mockSessionSocketService.onAvailableSessionsUpdated).toHaveBeenCalled();
            expect(mockSessionSocketService.onSessionAutoLocked).toHaveBeenCalled();
            expect(mockSessionSocketService.onStartGameSessionError).toHaveBeenCalled();
        });

        it('should handle avatar assignments updated', () => {
            const callback = mockSessionSocketService.onAvatarAssignmentsUpdated.calls.mostRecent().args[0];
            const mockData = { avatarAssignments: [{ avatar: Avatar.Avatar1, chosenBy: 'player1' }] };
            callback(mockData);
            expect(service.avatarAssignments()).toEqual(mockData.avatarAssignments);
        });

        it('should handle session players updated', () => {
            const callback = mockSessionSocketService.onSessionPlayersUpdated.calls.mostRecent().args[0];
            const mockData = { players: [mockPlayer] };
            callback(mockData);
            expect(service.players()).toEqual(mockData.players);
        });

        it('should handle game session started', () => {
            const callback = mockSessionSocketService.onGameSessionStarted.calls.mostRecent().args[0];
            callback();
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.GameSessionPage]);
        });

        it('should handle session joined event', () => {
            const callback = mockSessionSocketService.onSessionJoined.calls.mostRecent().args[0];
            const mockData = { gameId: 'game1', maxPlayers: 4 };
            callback(mockData);
            expect(service.gameId()).toBe('game1');
            expect(service.maxPlayers()).toBe(4);
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.WaitingRoomPage]);
        });

        it('should handle session created error', () => {
            const callback = mockSessionSocketService.onSessionCreatedError.calls.mostRecent().args[0];
            callback('Creation error');
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Erreur de création',
                message: 'Creation error',
                redirectRoute: ROUTES.HomePage
            });
        });

        it('should handle session join error', () => {
            const callback = mockSessionSocketService.onSessionJoinError.calls.mostRecent().args[0];
            callback('Join error');
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Erreur',
                message: 'Join error',
                redirectRoute: ROUTES.HomePage
            });
        });

        it('should handle avatar selection join error', () => {
            const callback = mockSessionSocketService.onAvatarSelectionJoinError.calls.mostRecent().args[0];
            callback('Avatar selection error');
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Erreur de connexion',
                message: 'Avatar selection error'
            });
        });

        it('should handle avatar selection joined', () => {
            const callback = mockSessionSocketService.onAvatarSelectionJoined.calls.mostRecent().args[0];
            const mockData = { sessionId: 'session1', playerId: 'player1' };
            callback(mockData);
            expect(service.id()).toBe('session1');
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.CharacterCreationPage]);
        });

        it('should handle available sessions updated', () => {
            const callback = mockSessionSocketService.onAvailableSessionsUpdated.calls.mostRecent().args[0];
            const mockData = { sessions: [{ id: 'session1', currentPlayers: 2, maxPlayers: 4 }] };
            callback(mockData);
            expect(service.availableSessions()).toEqual(mockData.sessions);
        });

        it('should handle session auto locked', () => {
            const callback = mockSessionSocketService.onSessionAutoLocked.calls.mostRecent().args[0];
            callback();
            expect(service.isRoomLocked()).toBe(true);
        });

        it('should handle start game session error', () => {
            const callback = mockSessionSocketService.onStartGameSessionError.calls.mostRecent().args[0];
            callback('Start game error');
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Impossible de démarrer le jeu',
                message: 'Start game error'
            });
        });
    });

    describe('Avatar Assignment Logic', () => {
        it('should clear old avatar assignment when assigning new one', () => {
            service.updateSession({
                avatarAssignments: [
                    { avatar: Avatar.Avatar1, chosenBy: 'player1' },
                    { avatar: Avatar.Avatar2, chosenBy: null }
                ]
            });
            
            service.updateAvatarAssignment('player1', Avatar.Avatar2, true);
            
            const assignments = service.avatarAssignments();
            expect(assignments.find(a => a.avatar === Avatar.Avatar1)?.chosenBy).toBeNull();
            expect(assignments.find(a => a.avatar === Avatar.Avatar2)?.chosenBy).toBe('player1');
        });
    });
});