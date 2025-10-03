import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Player } from '@common/models/player.model';
import { WaitingRoomActionsComponent } from './waiting-room-actions.component';

describe('WaitingRoomActionsComponent', () => {
    let component: WaitingRoomActionsComponent;
    let fixture: ComponentFixture<WaitingRoomActionsComponent>;
    let playerService: jasmine.SpyObj<PlayerService>;
    let sessionService: jasmine.SpyObj<SessionService>;

    beforeEach(async () => {
        playerService = jasmine.createSpyObj('PlayerService', ['isAdmin']);
        sessionService = jasmine.createSpyObj('SessionService', [
            'players',
            'isRoomLocked',
            'canBeLocked',
            'canBeUnlocked',
            'canStartGame',
            'lock',
            'unlock',
            'startGame',
        ]);

        await TestBed.configureTestingModule({
            imports: [WaitingRoomActionsComponent],
            providers: [
                { provide: PlayerService, useValue: playerService },
                { provide: SessionService, useValue: sessionService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomActionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('players', () => {
        it('should get players from session service', () => {
            const mockPlayers: Player[] = [];
            sessionService.players.and.returnValue(mockPlayers);
            expect(component.players).toBe(mockPlayers);
        });
    });

    describe('isAdmin', () => {
        it('should get admin status from player service', () => {
            playerService.isAdmin.and.returnValue(true);
            expect(component.isAdmin).toBeTrue();
        });
    });

    describe('isLocked', () => {
        it('should get locked status from session service', () => {
            sessionService.isRoomLocked.and.returnValue(true);
            expect(component.isLocked).toBeTrue();
        });
    });

    describe('canToggleLock', () => {
        it('should return true when room can be locked', () => {
            sessionService.canBeLocked.and.returnValue(true);
            sessionService.canBeUnlocked.and.returnValue(false);
            expect(component.canToggleLock).toBeTrue();
        });

        it('should return true when room can be unlocked', () => {
            sessionService.canBeLocked.and.returnValue(false);
            sessionService.canBeUnlocked.and.returnValue(true);
            expect(component.canToggleLock).toBeTrue();
        });

        it('should return false when room cannot be locked or unlocked', () => {
            sessionService.canBeLocked.and.returnValue(false);
            sessionService.canBeUnlocked.and.returnValue(false);
            expect(component.canToggleLock).toBeFalse();
        });
    });

    describe('canStartGame', () => {
        it('should get start game status from session service', () => {
            sessionService.canStartGame.and.returnValue(true);
            expect(component.canStartGame).toBeTrue();
        });
    });

    describe('toggleLock', () => {
        it('should lock room when it can be locked', () => {
            sessionService.canBeLocked.and.returnValue(true);
            sessionService.canBeUnlocked.and.returnValue(false);
            component.toggleLock();
            expect(sessionService.lock).toHaveBeenCalled();
            expect(sessionService.unlock).not.toHaveBeenCalled();
        });

        it('should unlock room when it can be unlocked', () => {
            sessionService.canBeLocked.and.returnValue(false);
            sessionService.canBeUnlocked.and.returnValue(true);
            component.toggleLock();
            expect(sessionService.lock).not.toHaveBeenCalled();
            expect(sessionService.unlock).toHaveBeenCalled();
        });

        it('should not call lock or unlock when neither is possible', () => {
            sessionService.canBeLocked.and.returnValue(false);
            sessionService.canBeUnlocked.and.returnValue(false);
            component.toggleLock();
            expect(sessionService.lock).not.toHaveBeenCalled();
            expect(sessionService.unlock).not.toHaveBeenCalled();
        });
    });

    describe('startGame', () => {
        it('should call start game on session service', () => {
            component.startGame();
            expect(sessionService.startGame).toHaveBeenCalled();
        });
    });
});
