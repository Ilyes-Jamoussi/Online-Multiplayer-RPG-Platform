import { TestBed } from '@angular/core/testing';
import { InGameSocketService } from './in-game-socket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { Orientation } from '@common/enums/orientation.enum';

describe('InGameSocketService', () => {
    let service: InGameSocketService;
    let mockSocketService: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        mockSocketService = jasmine.createSpyObj('SocketService', ['emit', 'onSuccessEvent']);

        TestBed.configureTestingModule({
            providers: [{ provide: SocketService, useValue: mockSocketService }],
        });
        service = TestBed.inject(InGameSocketService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Emit Events', () => {
        it('should emit playerJoinInGameSession', () => {
            service.playerJoinInGameSession('session1');
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerJoinInGameSession, 'session1');
        });

        it('should emit playerStartGame', () => {
            service.playerStartGame('session1');
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.GameStart, 'session1');
        });

        it('should emit playerLeaveInGameSession', () => {
            service.playerLeaveInGameSession('session1');
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerLeaveInGameSession, 'session1');
        });

        it('should emit playerEndTurn', () => {
            service.playerEndTurn('session1');
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerEndTurn, 'session1');
        });

        it('should emit toggleAdminMode', () => {
            service.toggleAdminMode('session1');
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.ToggleAdminMode, 'session1');
        });

        it('should emit playerMove', () => {
            service.playerMove('session1', Orientation.N);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerMove, {
                sessionId: 'session1',
                orientation: Orientation.N
            });
        });

        it('should emit playerTeleport', () => {
            service.playerTeleport('session1', 5, 10);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerTeleport, {
                sessionId: 'session1',
                x: 5,
                y: 10
            });
        });

        it('should emit playerToggleDoorAction', () => {
            service.playerToggleDoorAction('session1', 3, 7);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.ToggleDoorAction, {
                sessionId: 'session1',
                x: 3,
                y: 7
            });
        });
    });

    describe('Event Listeners', () => {
        it('should listen to onPlayerJoinedInGameSession', () => {
            const callback = jasmine.createSpy();
            service.onPlayerJoinedInGameSession(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerJoinedInGameSession, callback);
        });

        it('should listen to onGameStarted', () => {
            const callback = jasmine.createSpy();
            service.onGameStarted(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.GameStarted, callback);
        });

        it('should listen to onTurnStarted', () => {
            const callback = jasmine.createSpy();
            service.onTurnStarted(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.TurnStarted, callback);
        });

        it('should listen to onTurnEnded', () => {
            const callback = jasmine.createSpy();
            service.onTurnEnded(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.TurnEnded, callback);
        });

        it('should listen to onTurnTransitionEnded', () => {
            const callback = jasmine.createSpy();
            service.onTurnTransitionEnded(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.TurnTransitionEnded, callback);
        });

        it('should listen to onPlayerLeftInGameSession', () => {
            const callback = jasmine.createSpy();
            service.onPlayerLeftInGameSession(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerLeftInGameSession, callback);
        });

        it('should listen to onTurnTimeout', () => {
            const callback = jasmine.createSpy();
            service.onTurnTimeout(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.TurnTimeout, callback);
        });

        it('should listen to onTurnForcedEnd', () => {
            const callback = jasmine.createSpy();
            service.onTurnForcedEnd(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.TurnForcedEnd, callback);
        });

        it('should listen to onAdminModeToggled', () => {
            const callback = jasmine.createSpy();
            service.onAdminModeToggled(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.AdminModeToggled, callback);
        });

        it('should listen to onPlayerMoved', () => {
            const callback = jasmine.createSpy();
            service.onPlayerMoved(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerMoved, callback);
        });

        it('should listen to onLeftInGameSessionAck', () => {
            const callback = jasmine.createSpy();
            service.onLeftInGameSessionAck(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.LeftInGameSessionAck, callback);
        });

        it('should listen to onGameForceStopped', () => {
            const callback = jasmine.createSpy();
            service.onGameForceStopped(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.GameForceStopped, callback);
        });

        it('should listen to onPlayerReachableTiles', () => {
            const callback = jasmine.createSpy();
            service.onPlayerReachableTiles(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerReachableTiles, callback);
        });

        it('should listen to onPlayerTeleported', () => {
            const callback = jasmine.createSpy();
            service.onPlayerTeleported(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerTeleported, callback);
        });

        it('should listen to onDoorToggled', () => {
            const callback = jasmine.createSpy();
            service.onDoorToggled(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.DoorToggled, callback);
        });

        it('should listen to onPlayerUpdated', () => {
            const callback = jasmine.createSpy();
            service.onPlayerUpdated(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerUpdated, callback);
        });

        it('should listen to onPlayerActionUsed', () => {
            const callback = jasmine.createSpy();
            service.onPlayerActionUsed(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerActionUsed, callback);
        });

        it('should listen to onPlayerAvailableActions', () => {
            const callback = jasmine.createSpy();
            service.onPlayerAvailableActions(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerAvailableActions, callback);
        });

        it('should listen to onGameOver', () => {
            const callback = jasmine.createSpy();
            service.onGameOver(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.GameOver, callback);
        });
    });
});