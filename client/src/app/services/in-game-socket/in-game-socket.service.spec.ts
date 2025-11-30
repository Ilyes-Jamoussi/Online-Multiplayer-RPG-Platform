import { TestBed } from '@angular/core/testing';
import { InGameSocketService } from './in-game-socket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';

describe('InGameSocketService', () => {
    let service: InGameSocketService;
    let mockSocketService: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        mockSocketService = jasmine.createSpyObj('SocketService', ['emit', 'onSuccessEvent', 'onErrorEvent']);

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
            service.playerMove({ sessionId: 'session1', orientation: Orientation.N });
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerMove, {
                sessionId: 'session1',
                orientation: Orientation.N,
            });
        });

        it('should emit playerTeleport', () => {
            service.playerTeleport({ sessionId: 'session1', x: 5, y: 10 });
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerTeleport, {
                sessionId: 'session1',
                x: 5,
                y: 10,
            });
        });

        it('should emit playerToggleDoorAction', () => {
            service.playerToggleDoorAction({ sessionId: 'session1', x: 3, y: 7 });
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.ToggleDoorAction, {
                sessionId: 'session1',
                x: 3,
                y: 7,
            });
        });

        it('should emit playerBoardBoat', () => {
            const MOCK_SESSION_ID = 'session1';
            const MOCK_X = 5;
            const MOCK_Y = 10;
            service.playerBoardBoat(MOCK_SESSION_ID, MOCK_X, MOCK_Y);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerBoardBoat, {
                sessionId: MOCK_SESSION_ID,
                x: MOCK_X,
                y: MOCK_Y,
            });
        });

        it('should emit playerDisembarkBoat', () => {
            const MOCK_SESSION_ID = 'session1';
            const MOCK_X = 3;
            const MOCK_Y = 7;
            service.playerDisembarkBoat(MOCK_SESSION_ID, MOCK_X, MOCK_Y);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerDisembarkBoat, {
                sessionId: MOCK_SESSION_ID,
                x: MOCK_X,
                y: MOCK_Y,
            });
        });

        it('should emit playerSanctuaryRequest', () => {
            const MOCK_SESSION_ID = 'session1';
            const MOCK_X = 2;
            const MOCK_Y = 4;
            const MOCK_KIND = PlaceableKind.HEAL;
            const mockData = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: MOCK_KIND };
            service.playerSanctuaryRequest(mockData);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerSanctuaryRequest, mockData);
        });

        it('should emit playerSanctuaryAction without double', () => {
            const MOCK_SESSION_ID = 'session1';
            const MOCK_X = 1;
            const MOCK_Y = 2;
            const MOCK_KIND = PlaceableKind.FIGHT;
            const mockData = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: MOCK_KIND };
            service.playerSanctuaryAction(mockData);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerSanctuaryAction, mockData);
        });

        it('should emit playerSanctuaryAction with double', () => {
            const MOCK_SESSION_ID = 'session1';
            const MOCK_X = 1;
            const MOCK_Y = 2;
            const MOCK_KIND = PlaceableKind.HEAL;
            const MOCK_DOUBLE = true;
            const mockData = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y, kind: MOCK_KIND, double: MOCK_DOUBLE };
            service.playerSanctuaryAction(mockData);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.PlayerSanctuaryAction, mockData);
        });

        it('should emit requestFlagTransfer', () => {
            const MOCK_SESSION_ID = 'session1';
            const MOCK_X = 6;
            const MOCK_Y = 8;
            const mockData = { sessionId: MOCK_SESSION_ID, x: MOCK_X, y: MOCK_Y };
            service.requestFlagTransfer(mockData);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.FlagTransferRequest, mockData);
        });

        it('should emit respondToFlagTransfer', () => {
            const MOCK_SESSION_ID = 'session1';
            const MOCK_FROM_PLAYER_ID = 'player2';
            const MOCK_ACCEPTED = true;
            const mockData = { sessionId: MOCK_SESSION_ID, fromPlayerId: MOCK_FROM_PLAYER_ID, accepted: MOCK_ACCEPTED };
            service.respondToFlagTransfer(mockData);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.FlagTransferResponse, mockData);
        });

        it('should emit loadGameStatistics', () => {
            const MOCK_SESSION_ID = 'session1';
            service.loadGameStatistics(MOCK_SESSION_ID);
            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.LoadGameStatistics, MOCK_SESSION_ID);
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

        it('should listen to onLoadGameStatistics', () => {
            const callback = jasmine.createSpy();
            service.onLoadGameStatistics(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.LoadGameStatistics, callback);
        });

        it('should listen to onPlaceableUpdated', () => {
            const callback = jasmine.createSpy();
            service.onPlaceableUpdated(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlaceableUpdated, callback);
        });

        it('should listen to onPlaceableDisabledUpdated', () => {
            const callback = jasmine.createSpy();
            service.onPlaceableDisabledUpdated(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlaceableDisabledUpdated, callback);
        });

        it('should listen to onOpenSanctuary', () => {
            const callback = jasmine.createSpy();
            service.onOpenSanctuary(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.OpenSanctuary, callback);
        });

        it('should listen to onOpenSanctuaryError', () => {
            const callback = jasmine.createSpy();
            service.onOpenSanctuaryError(callback);
            expect(mockSocketService.onErrorEvent).toHaveBeenCalledWith(InGameEvents.OpenSanctuary, callback);
        });

        it('should listen to onSanctuaryActionFailed', () => {
            const callback = jasmine.createSpy();
            service.onSanctuaryActionFailed(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.SanctuaryActionFailed, callback);
        });

        it('should listen to onSanctuaryActionSuccess', () => {
            const callback = jasmine.createSpy();
            service.onSanctuaryActionSuccess(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.SanctuaryActionSuccess, callback);
        });

        it('should listen to onPlayerBonusesChanged', () => {
            const callback = jasmine.createSpy();
            service.onPlayerBonusesChanged(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerBonusesChanged, callback);
        });

        it('should listen to onPlayerBoardedBoat', () => {
            const callback = jasmine.createSpy();
            service.onPlayerBoardedBoat(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerBoardedBoat, callback);
        });

        it('should listen to onPlayerDisembarkedBoat', () => {
            const callback = jasmine.createSpy();
            service.onPlayerDisembarkedBoat(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerDisembarkedBoat, callback);
        });

        it('should listen to onSessionUpdated', () => {
            const callback = jasmine.createSpy();
            service.onSessionUpdated(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.SessionUpdated, callback);
        });

        it('should listen to onFlagPickedUp', () => {
            const callback = jasmine.createSpy();
            service.onFlagPickedUp(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.FlagPickedUp, callback);
        });

        it('should listen to onFlagTransferRequested', () => {
            const callback = jasmine.createSpy();
            service.onFlagTransferRequested(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.FlagTransferRequested, callback);
        });

        it('should listen to onFlagTransferResult', () => {
            const callback = jasmine.createSpy();
            service.onFlagTransferResult(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.FlagTransferResult, callback);
        });

        it('should listen to onFlagTransferred', () => {
            const callback = jasmine.createSpy();
            service.onFlagTransferred(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.FlagTransferred, callback);
        });

        it('should listen to onFlagTransferRequestsCleared', () => {
            const callback = jasmine.createSpy();
            service.onFlagTransferRequestsCleared(callback);
            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.FlagTransferRequestsCleared, callback);
        });
    });
});
