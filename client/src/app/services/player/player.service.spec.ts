import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PlayerService } from './player.service';
import { SessionService } from '@app/services/session/session.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { BonusType } from '@app/enums/character-creation.enum';
import { ROUTES } from '@app/enums/routes.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { signal } from '@angular/core';

describe('PlayerService', () => {
    let service: PlayerService;
    let mockSessionService: jasmine.SpyObj<SessionService>;
    let mockSessionSocketService: jasmine.SpyObj<SessionSocketService>;
    let mockInGameSocketService: jasmine.SpyObj<InGameSocketService>;
    let mockNotificationService: jasmine.SpyObj<NotificationCoordinatorService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(() => {
        mockSessionService = jasmine.createSpyObj('SessionService', [
            'resetSession', 'updateAvatarAssignment', 'createSession', 'joinAvatarSelection',
            'joinSession', 'leaveSession', 'leaveAvatarSelection', 'updateSession', 'handleSessionJoined'
        ], {
            id: signal('session1'),
            avatarAssignments: signal([
                { avatar: Avatar.Avatar1, chosenBy: null },
                { avatar: Avatar.Avatar2, chosenBy: 'other-player' }
            ])
        });

        mockSessionSocketService = jasmine.createSpyObj('SessionSocketService', [
            'onSessionCreated', 'onSessionEnded', 'onAvatarSelectionJoined', 'onSessionJoined'
        ]);

        mockInGameSocketService = jasmine.createSpyObj('InGameSocketService', ['onPlayerUpdated']);
        mockNotificationService = jasmine.createSpyObj('NotificationCoordinatorService', ['displayErrorPopup']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                { provide: SessionService, useValue: mockSessionService },
                { provide: SessionSocketService, useValue: mockSessionSocketService },
                { provide: InGameSocketService, useValue: mockInGameSocketService },
                { provide: NotificationCoordinatorService, useValue: mockNotificationService },
                { provide: Router, useValue: mockRouter },
            ],
        });
        service = TestBed.inject(PlayerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Player Properties', () => {
        it('should return player properties', () => {
            service.updatePlayer({ name: 'Test Player', health: 5 });
            expect(service.name()).toBe('Test Player');
            expect(service.health()).toBe(5);
        });

        it('should return bonus selections', () => {
            service.setBonus(BonusType.Life);
            expect(service.isLifeBonusSelected()).toBe(true);
            expect(service.isSpeedBonusSelected()).toBe(false);

            service.setBonus(BonusType.Speed);
            expect(service.isLifeBonusSelected()).toBe(false);
            expect(service.isSpeedBonusSelected()).toBe(true);
        });
    });

    describe('Player Configuration', () => {
        it('should set player name', () => {
            service.setName('New Name');
            expect(service.name()).toBe('New Name');
        });

        it('should set life bonus', () => {
            service.setBonus(BonusType.Life);
            expect(service.health()).toBe(6);
            expect(service.maxHealth()).toBe(6);
            expect(service.speed()).toBe(4);
        });

        it('should set speed bonus', () => {
            service.setBonus(BonusType.Speed);
            expect(service.health()).toBe(4);
            expect(service.speed()).toBe(6);
        });

        it('should set attack dice to D6 and defense to D4', () => {
            service.setDice('attack', Dice.D6);
            expect(service.attackDice()).toBe(Dice.D6);
            expect(service.defenseDice()).toBe(Dice.D4);
        });

        it('should set defense dice to D6 and attack to D4', () => {
            service.setDice('defense', Dice.D6);
            expect(service.attackDice()).toBe(Dice.D4);
            expect(service.defenseDice()).toBe(Dice.D6);
        });
    });

    describe('Random Generation', () => {
        it('should generate random character', () => {
            spyOn(Math, 'random').and.returnValues(0.1, 0.1, 0.1, 0.1);
            service.generateRandom();
            
            expect(service.name()).toBeTruthy();
            expect(service.avatar()).toBe(Avatar.Avatar1);
        });
    });

    describe('Player State', () => {
        it('should update player', () => {
            service.updatePlayer({ name: 'Updated', health: 10 });
            expect(service.name()).toBe('Updated');
            expect(service.health()).toBe(10);
        });

        it('should reset player and session', () => {
            service.updatePlayer({ name: 'Test' });
            service.reset();
            expect(service.name()).toBe('');
            expect(mockSessionService.resetSession).toHaveBeenCalled();
        });

        it('should set as admin', () => {
            service.setAsAdmin();
            expect(service.isAdmin()).toBe(true);
        });

        it('should set as guest', () => {
            service.setAsGuest();
            expect(service.isAdmin()).toBe(false);
        });

        it('should check if connected', () => {
            expect(service.isConnected()).toBe(true);
            Object.defineProperty(mockSessionService, 'id', {
                value: signal(''),
                configurable: true
            });
            expect(service.isConnected()).toBe(false);
        });
    });

    describe('Avatar Selection', () => {
        it('should select avatar as admin', () => {
            service.updatePlayer({ id: 'player1' });
            service.selectAvatar(Avatar.Avatar1);
            expect(service.avatar()).toBe(Avatar.Avatar1);
            expect(mockSessionService.updateAvatarAssignment).toHaveBeenCalledWith('player1', Avatar.Avatar1, true);
        });

        it('should select avatar as guest', () => {
            service.updatePlayer({ id: 'player1' });
            service.setAsGuest();
            service.selectAvatar(Avatar.Avatar1);
            expect(service.avatar()).toBe(Avatar.Avatar1);
            expect(mockSessionService.updateAvatarAssignment).toHaveBeenCalledWith('player1', Avatar.Avatar1, false);
        });
    });

    describe('Session Actions', () => {
        it('should create session', () => {
            service.createSession();
            expect(mockSessionService.createSession).toHaveBeenCalledWith(service.player());
        });

        it('should join avatar selection', () => {
            service.joinAvatarSelection('session1');
            expect(mockSessionService.joinAvatarSelection).toHaveBeenCalledWith('session1');
        });

        it('should join session', () => {
            service.joinSession();
            expect(mockSessionService.joinSession).toHaveBeenCalledWith(service.player());
        });

        it('should leave session', () => {
            service.leaveSession();
            expect(mockSessionService.leaveSession).toHaveBeenCalled();
        });

        it('should leave avatar selection for non-admin', () => {
            service.setAsGuest();
            service.leaveAvatarSelection();
            expect(mockSessionService.leaveAvatarSelection).toHaveBeenCalled();
        });

        it('should not leave avatar selection for admin', () => {
            service.setAsAdmin();
            service.leaveAvatarSelection();
            expect(mockSessionService.leaveAvatarSelection).not.toHaveBeenCalled();
        });
    });

    describe('Actions', () => {
        it('should update actions remaining', () => {
            service.updateActionsRemaining(3);
            expect(service.actionsRemaining()).toBe(3);
        });
    });

    describe('Event Listeners', () => {
        it('should handle session created', () => {
            const callback = mockSessionSocketService.onSessionCreated.calls.mostRecent().args[0];
            callback({ sessionId: 'session1', playerId: 'player1' });
            
            expect(service.id()).toBe('player1');
            expect(mockSessionService.updateSession).toHaveBeenCalledWith({ id: 'session1' });
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.WaitingRoomPage]);
        });

        it('should handle session ended', () => {
            const callback = mockSessionSocketService.onSessionEnded.calls.mostRecent().args[0];
            callback('Session ended message');
            
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Session terminée',
                message: 'Session ended message',
                redirectRoute: ROUTES.HomePage
            });
        });

        it('should handle avatar selection joined', () => {
            const callback = mockSessionSocketService.onAvatarSelectionJoined.calls.mostRecent().args[0];
            callback({ sessionId: 'session1', playerId: 'player1' });
            
            expect(service.id()).toBe('player1');
            expect(mockSessionService.updateSession).toHaveBeenCalledWith({ id: 'session1' });
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.CharacterCreationPage]);
        });

        it('should handle session joined without modified name', () => {
            const callback = mockSessionSocketService.onSessionJoined.calls.mostRecent().args[0];
            callback({ gameId: 'game1', maxPlayers: 4 });
            
            expect(mockSessionService.handleSessionJoined).toHaveBeenCalledWith({ gameId: 'game1', maxPlayers: 4 });
        });

        it('should handle session joined with modified name', () => {
            const callback = mockSessionSocketService.onSessionJoined.calls.mostRecent().args[0];
            callback({ gameId: 'game1', maxPlayers: 4, modifiedPlayerName: 'Modified Name' });
            
            expect(service.name()).toBe('Modified Name');
            expect(mockSessionService.handleSessionJoined).toHaveBeenCalledWith({ gameId: 'game1', maxPlayers: 4 });
        });

        it('should handle player updated for current player', () => {
            service.updatePlayer({ id: 'player1' });
            const callback = mockInGameSocketService.onPlayerUpdated.calls.mostRecent().args[0];
            callback({ id: 'player1', name: 'Updated Player', health: 10 } as any);
            
            expect(service.name()).toBe('Updated Player');
            expect(service.health()).toBe(10);
        });

        it('should not handle player updated for other player', () => {
            service.updatePlayer({ id: 'player1', name: 'Original' });
            const callback = mockInGameSocketService.onPlayerUpdated.calls.mostRecent().args[0];
            callback({ id: 'other-player', name: 'Other Player' } as any);
            
            expect(service.name()).toBe('Original');
        });
    });
});