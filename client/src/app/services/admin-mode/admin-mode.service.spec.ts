import { Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AdminModeService } from './admin-mode.service';
import { AdminModeToggledDto } from '@app/dto/admin-mode-toggled-dto';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { ResetService } from '@app/services/reset/reset.service';

const TEST_X_COORDINATE = 5;
const TEST_Y_COORDINATE = 3;

describe('AdminModeService', () => {
    let service: AdminModeService;
    let mockInGameSocketService: jasmine.SpyObj<InGameSocketService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockSessionService: jasmine.SpyObj<SessionService>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let resetService: { reset$: Subject<void> };

    let adminModeToggledCallback: (data: { isAdminModeActive: boolean }) => void;

    beforeEach(() => {
        resetService = { reset$: new Subject<void>() };

        const inGameSocketSpy = jasmine.createSpyObj('InGameSocketService', ['toggleAdminMode', 'playerTeleport', 'onAdminModeToggled']);

        inGameSocketSpy.onAdminModeToggled.and.callFake((callback: (data: AdminModeToggledDto) => void) => {
            adminModeToggledCallback = callback;
        });

        const playerSpy = jasmine.createSpyObj('PlayerService', ['isAdmin']);
        const sessionSpy = jasmine.createSpyObj('SessionService', ['id']);
        const inGameSpy = jasmine.createSpyObj('InGameService', ['isMyTurn', 'isGameStarted']);

        TestBed.configureTestingModule({
            providers: [
                AdminModeService,
                { provide: InGameSocketService, useValue: inGameSocketSpy },
                { provide: PlayerService, useValue: playerSpy },
                { provide: SessionService, useValue: sessionSpy },
                { provide: InGameService, useValue: inGameSpy },
                { provide: ResetService, useValue: resetService },
            ],
        });

        service = TestBed.inject(AdminModeService);
        mockInGameSocketService = TestBed.inject(InGameSocketService) as jasmine.SpyObj<InGameSocketService>;
        mockPlayerService = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
        mockSessionService = TestBed.inject(SessionService) as jasmine.SpyObj<SessionService>;
        mockInGameService = TestBed.inject(InGameService) as jasmine.SpyObj<InGameService>;

        mockSessionService.id.and.returnValue('session1');
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with admin mode deactivated', () => {
        expect(service.isAdminModeActivated()).toBe(false);
    });

    describe('toggleAdminMode', () => {
        it('should toggle admin mode when player is admin', () => {
            mockPlayerService.isAdmin.and.returnValue(true);

            service.toggleAdminMode();

            expect(mockInGameSocketService.toggleAdminMode).toHaveBeenCalledWith('session1');
        });

        it('should not toggle admin mode when player is not admin', () => {
            mockPlayerService.isAdmin.and.returnValue(false);

            service.toggleAdminMode();

            expect(mockInGameSocketService.toggleAdminMode).not.toHaveBeenCalled();
        });
    });

    describe('teleportPlayer', () => {
        beforeEach(() => {
            service.isAdminModeActivated.set(true);
            mockInGameService.isMyTurn.and.returnValue(true);
            mockInGameService.isGameStarted.and.returnValue(true);
        });

        it('should teleport player when all conditions are met', () => {
            service.teleportPlayer(TEST_X_COORDINATE, TEST_Y_COORDINATE);

            expect(mockInGameSocketService.playerTeleport).toHaveBeenCalledWith({
                sessionId: 'session1',
                x: TEST_X_COORDINATE,
                y: TEST_Y_COORDINATE,
            });
        });

        it('should not teleport when admin mode is not activated', () => {
            service.isAdminModeActivated.set(false);

            service.teleportPlayer(TEST_X_COORDINATE, TEST_Y_COORDINATE);

            expect(mockInGameSocketService.playerTeleport).not.toHaveBeenCalled();
        });

        it('should not teleport when it is not player turn', () => {
            mockInGameService.isMyTurn.and.returnValue(false);

            service.teleportPlayer(TEST_X_COORDINATE, TEST_Y_COORDINATE);

            expect(mockInGameSocketService.playerTeleport).not.toHaveBeenCalled();
        });

        it('should not teleport when game is not started', () => {
            mockInGameService.isGameStarted.and.returnValue(false);

            service.teleportPlayer(TEST_X_COORDINATE, TEST_Y_COORDINATE);

            expect(mockInGameSocketService.playerTeleport).not.toHaveBeenCalled();
        });
    });

    describe('socket event handlers', () => {
        describe('onAdminModeToggled', () => {
            it('should update admin mode state when toggled to active', () => {
                adminModeToggledCallback({ isAdminModeActive: true });

                expect(service.isAdminModeActivated()).toBe(true);
            });

            it('should update admin mode state when toggled to inactive', () => {
                service.isAdminModeActivated.set(true);

                adminModeToggledCallback({ isAdminModeActive: false });

                expect(service.isAdminModeActivated()).toBe(false);
            });
        });
    });

    describe('reset', () => {
        it('should set admin mode to false', () => {
            service.isAdminModeActivated.set(true);
            service.reset();
            expect(service.isAdminModeActivated()).toBe(false);
        });
    });

    describe('reset$ subscription', () => {
        it('should call reset when reset$ emits', () => {
            service.isAdminModeActivated.set(true);
            resetService.reset$.next();
            expect(service.isAdminModeActivated()).toBe(false);
        });
    });
});
