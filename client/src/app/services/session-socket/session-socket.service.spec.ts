// import { TestBed } from '@angular/core/testing';
// import { SessionSocketService } from './session-socket.service';
// import { SocketService } from '@app/services/socket/socket.service';
// import { PlayerDto } from '@app/dto/player-dto';
// import { SessionEvents } from '@common/enums/session-events.enum';

// describe('SessionSocketService', () => {
//     let service: SessionSocketService;
//     let mockSocketService: jasmine.SpyObj<SocketService>;

//     beforeEach(() => {
//         mockSocketService = jasmine.createSpyObj('SocketService', ['emit', 'onSuccessEvent', 'onErrorEvent']);

//         TestBed.configureTestingModule({
//             providers: [{ provide: SocketService, useValue: mockSocketService }],
//         });
//         service = TestBed.inject(SessionSocketService);
//     });

//     it('should be created', () => {
//         expect(service).toBeTruthy();
//     });

//     describe('Emit Events', () => {
//         it('should emit createSession', () => {
//             const data = { gameId: 'game1', maxPlayers: 4, player: {} as PlayerDto };
//             service.createSession(data);
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.CreateSession, data);
//         });

//         it('should emit joinAvatarSelection', () => {
//             const data = { sessionId: 'session1' };
//             service.joinAvatarSelection(data);
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.JoinAvatarSelection, data);
//         });

//         it('should emit leaveAvatarSelection', () => {
//             const data = { sessionId: 'session1' };
//             service.leaveAvatarSelection(data);
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.LeaveAvatarSelection, data);
//         });

//         it('should emit joinSession', () => {
//             const data = { sessionId: 'session1', player: {} as PlayerDto };
//             service.joinSession(data);
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.JoinSession, data);
//         });

//         it('should emit leaveSession', () => {
//             service.leaveSession();
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.LeaveSession, {});
//         });

//         it('should emit startGameSession', () => {
//             service.startGameSession();
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.StartGameSession, {});
//         });

//         it('should emit lockSession', () => {
//             service.lockSession();
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.LockSession, {});
//         });

//         it('should emit unlockSession', () => {
//             service.unlockSession();
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.UnlockSession, {});
//         });

//         it('should emit kickPlayer', () => {
//             const data = { playerId: 'player1' };
//             service.kickPlayer(data);
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.KickPlayer, data);
//         });

//         it('should emit updateAvatarsAssignment', () => {
//             const data = { sessionId: 'session1', avatar: 'avatar1' };
//             service.updateAvatarsAssignment(data);
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.UpdateAvatarAssignments, data);
//         });

//         it('should emit loadAvailableSessions', () => {
//             service.loadAvailableSessions();
//             expect(mockSocketService.emit).toHaveBeenCalledWith(SessionEvents.LoadAvailableSessions, {});
//         });
//     });

//     describe('Success Event Listeners', () => {
//         it('should listen to sessionCreated', () => {
//             const callback = jasmine.createSpy();
//             service.onSessionCreated(callback);
//             expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionCreated, callback);
//         });

//         it('should listen to avatarSelectionJoined', () => {
//             const callback = jasmine.createSpy();
//             service.onAvatarSelectionJoined(callback);
//             expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.AvatarSelectionJoined, callback);
//         });

//         it('should listen to sessionJoined', () => {
//             const callback = jasmine.createSpy();
//             service.onSessionJoined(callback);
//             expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionJoined, callback);
//         });

//         it('should listen to sessionEnded with message extraction', () => {
//             const callback = jasmine.createSpy();
//             service.onSessionEnded(callback);
//             expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionEnded, jasmine.any(Function));

//             const wrappedCallback = mockSocketService.onSuccessEvent.calls.mostRecent().args[1];
//             wrappedCallback({ message: 'test message' });
//             expect(callback).toHaveBeenCalledWith('test message');
//         });

//         it('should listen to avatarAssignmentsUpdated', () => {
//             const callback = jasmine.createSpy();
//             service.onAvatarAssignmentsUpdated(callback);
//             expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.AvatarAssignmentsUpdated, callback);
//         });

//         it('should listen to sessionPlayersUpdated', () => {
//             const callback = jasmine.createSpy();
//             service.onSessionPlayersUpdated(callback);
//             expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionPlayersUpdated, callback);
//         });

//         it('should listen to gameSessionStarted', () => {
//             const callback = jasmine.createSpy();
//             service.onGameSessionStarted(callback);
//             expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.GameSessionStarted, callback);
//         });

//         it('should listen to availableSessionsUpdated', () => {
//             const callback = jasmine.createSpy();
//             service.onAvailableSessionsUpdated(callback);
//             expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.AvailableSessionsUpdated, callback);
//         });

//         it('should listen to sessionAutoLocked', () => {
//             const callback = jasmine.createSpy();
//             service.onSessionAutoLocked(callback);
//             expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionAutoLocked, callback);
//         });
//     });
// });
