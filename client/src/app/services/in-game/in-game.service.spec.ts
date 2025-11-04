import { TestBed } from '@angular/core/testing';
import { InGameService } from './in-game.service';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { PlayerService } from '@app/services/player/player.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { ROUTES } from '@app/enums/routes.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { signal } from '@angular/core';
import { Player } from '@common/interfaces/player.interface';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';

describe('InGameService', () => {
    let service: InGameService;
    let mockInGameSocketService: jasmine.SpyObj<InGameSocketService>;
    let mockSessionService: jasmine.SpyObj<SessionService>;
    let mockTimerCoordinatorService: jasmine.SpyObj<TimerCoordinatorService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockNotificationService: jasmine.SpyObj<NotificationCoordinatorService>;

    const mockPlayer: Player = {
        id: 'player1',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isAdmin: false,
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
        isInGame: true,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
    };

    beforeEach(() => {
        mockInGameSocketService = jasmine.createSpyObj('InGameSocketService', [
            'playerJoinInGameSession', 'playerLeaveInGameSession', 'playerStartGame',
            'playerMove', 'playerEndTurn', 'playerToggleDoorAction',
            'onPlayerJoinedInGameSession', 'onGameStarted', 'onTurnStarted', 'onTurnEnded',
            'onTurnTransitionEnded', 'onPlayerLeftInGameSession', 'onPlayerMoved',
            'onPlayerAvailableActions', 'onLeftInGameSessionAck', 'onGameForceStopped',
            'onPlayerReachableTiles', 'onPlayerTeleported', 'onPlayerActionUsed', 'onGameOver'
        ]);

        mockSessionService = jasmine.createSpyObj('SessionService', [], {
            id: signal('session1')
        });

        mockTimerCoordinatorService = jasmine.createSpyObj('TimerCoordinatorService', [
            'startTurnTimer', 'stopTurnTimer', 'resetAllTimers'
        ], {
            turnTimeRemaining: signal(30)
        });

        mockPlayerService = jasmine.createSpyObj('PlayerService', ['updateActionsRemaining', 'updatePlayer'], {
            id: signal('player1')
        });

        mockNotificationService = jasmine.createSpyObj('NotificationCoordinatorService', [
            'displayErrorPopup', 'displayInformationPopup', 'showInfoToast'
        ]);

        TestBed.configureTestingModule({
            providers: [
                { provide: InGameSocketService, useValue: mockInGameSocketService },
                { provide: SessionService, useValue: mockSessionService },
                { provide: TimerCoordinatorService, useValue: mockTimerCoordinatorService },
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: NotificationCoordinatorService, useValue: mockNotificationService },
            ],
        });
        service = TestBed.inject(InGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Basic Properties', () => {
        it('should return session id', () => {
            expect(service.sessionId()).toBe('session1');
        });

        it('should check if is my turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false }
            });
            expect(service.isMyTurn()).toBe(true);
        });

        it('should get active player', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
                inGamePlayers: { player1: mockPlayer }
            });
            expect(service.activePlayer).toEqual(mockPlayer);
        });

        it('should get currently playing players', () => {
            const inactivePlayers = { ...mockPlayer, isInGame: false };
            service.updateInGameSession({
                inGamePlayers: { player1: mockPlayer, player2: inactivePlayers }
            });
            expect(service.currentlyPlayers).toEqual([mockPlayer]);
        });

        it('should get turn transition message for my turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false }
            });
            expect(service.turnTransitionMessage).toBe("C'est ton tour !");
        });

        it('should get turn transition message for other player turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player2', hasUsedAction: false },
                inGamePlayers: { player2: { ...mockPlayer, id: 'player2', name: 'Other Player' } }
            });
            expect(service.turnTransitionMessage).toBe("C'est le tour de Other Player !");
        });
    });

    describe('Game Actions', () => {
        it('should toggle door action', () => {
            service.toggleDoorAction(5, 10);
            expect(mockInGameSocketService.playerToggleDoorAction).toHaveBeenCalledWith({ sessionId: 'session1', x: 5, y: 10 });
        });

        it('should handle player action used', () => {
            service.playerActionUsed();
            expect(service.hasUsedAction()).toBe(true);
            expect(mockPlayerService.updateActionsRemaining).toHaveBeenCalledWith(0);
        });

        it('should activate action mode', () => {
            service.activateActionMode();
            expect(service.isActionModeActive()).toBe(true);
        });

        it('should deactivate action mode', () => {
            service.activateActionMode();
            service.deactivateActionMode();
            expect(service.isActionModeActive()).toBe(false);
            expect(service.availableActions()).toEqual([]);
        });

        it('should load in-game session when session exists', () => {
            service.loadInGameSession();
            expect(mockInGameSocketService.playerJoinInGameSession).toHaveBeenCalledWith('session1');
        });

        it('should handle load in-game session when no session', () => {
            Object.defineProperty(mockSessionService, 'id', {
                value: signal(''),
                configurable: true
            });
            service.loadInGameSession();
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Session non trouvée',
                message: `Vous n'êtes connecté à aucune session`,
                redirectRoute: ROUTES.HomePage
            });
        });

        it('should leave game', () => {
            service.leaveGame();
            expect(mockInGameSocketService.playerLeaveInGameSession).toHaveBeenCalledWith('session1');
        });



        it('should move player when conditions are met', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
                isGameStarted: true
            });
            service.movePlayer(Orientation.N);
            expect(mockInGameSocketService.playerMove).toHaveBeenCalledWith({ sessionId: 'session1', orientation: Orientation.N });
        });

        it('should not move player when not my turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player2', hasUsedAction: false },
                isGameStarted: true
            });
            service.movePlayer(Orientation.N);
            expect(mockInGameSocketService.playerMove).not.toHaveBeenCalled();
        });

        it('should not move player when game not started', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
                isGameStarted: false
            });
            service.movePlayer(Orientation.N);
            expect(mockInGameSocketService.playerMove).not.toHaveBeenCalled();
        });

        it('should end turn', () => {
            service.endTurn();
            expect(mockInGameSocketService.playerEndTurn).toHaveBeenCalledWith('session1');
        });

        it('should get player by id', () => {
            service.updateInGameSession({
                inGamePlayers: { player1: mockPlayer }
            });
            expect(service.getPlayerByPlayerId('player1')).toEqual(mockPlayer);
        });

        it('should update in-game session', () => {
            service.updateInGameSession({ isGameStarted: true });
            expect(service.isGameStarted()).toBe(true);
        });
    });

    describe('Timer Management', () => {
        it('should start turn timer', () => {
            service.startTurnTimer();
            expect(mockTimerCoordinatorService.startTurnTimer).toHaveBeenCalled();
        });

        it('should stop turn timer', () => {
            service.stopTurnTimer();
            expect(mockTimerCoordinatorService.stopTurnTimer).toHaveBeenCalled();
        });

        it('should start turn transition timer', () => {
            service.startTurnTransitionTimer();
            expect(mockTimerCoordinatorService.startTurnTimer).toHaveBeenCalled();
        });

        it('should handle turn end', () => {
            const mockSession = { currentTurn: { turnNumber: 2, activePlayerId: 'player2', hasUsedAction: false } } as any;
            service.turnEnd(mockSession);
            expect(service.isTransitioning()).toBe(true);
            expect(mockTimerCoordinatorService.stopTurnTimer).toHaveBeenCalled();
            expect(mockTimerCoordinatorService.startTurnTimer).toHaveBeenCalled();
        });

        it('should handle turn transition ended', () => {
            service.turnEnd({} as any);
            service.turnTransitionEnded();
            expect(service.isTransitioning()).toBe(false);
        });
    });

    describe('Reset', () => {
        it('should reset all state', () => {
            service.reset();
            expect(mockTimerCoordinatorService.resetAllTimers).toHaveBeenCalled();
            expect(service.isGameStarted()).toBe(false);
            expect(service.isTransitioning()).toBe(false);
            expect(service.reachableTiles()).toEqual([]);
            expect(service.gameOverData()).toBeNull();
        });
    });

    describe('Socket Event Listeners', () => {
        it('should handle player joined in-game session', () => {
            const callback = mockInGameSocketService.onPlayerJoinedInGameSession.calls.mostRecent().args[0];
            const mockData = { id: 'session1' } as any;
            callback(mockData);
            expect(service.inGameSession().id).toBe('session1');
        });

        it('should handle game started', () => {
            const callback = mockInGameSocketService.onGameStarted.calls.mostRecent().args[0];
            const mockData = { isGameStarted: true } as any;
            callback(mockData);
            expect(service.isGameStarted()).toBe(true);
            expect(mockTimerCoordinatorService.startTurnTimer).toHaveBeenCalled();
        });

        it('should handle turn started', () => {
            const callback = mockInGameSocketService.onTurnStarted.calls.mostRecent().args[0];
            const mockData = { isGameStarted: true } as any;
            callback(mockData);
            expect(service.isGameStarted()).toBe(true);
            expect(mockTimerCoordinatorService.startTurnTimer).toHaveBeenCalled();
        });

        it('should handle turn ended', () => {
            const callback = mockInGameSocketService.onTurnEnded.calls.mostRecent().args[0];
            const mockData = { currentTurn: { turnNumber: 2, activePlayerId: 'player2', hasUsedAction: false } } as any;
            callback(mockData);
            expect(service.isTransitioning()).toBe(true);
        });

        it('should handle turn transition ended', () => {
            service.turnEnd({} as any);
            const callback = mockInGameSocketService.onTurnTransitionEnded.calls.mostRecent().args[0];
            callback();
            expect(service.isTransitioning()).toBe(false);
        });

        it('should handle player left for other player', () => {
            const callback = mockInGameSocketService.onPlayerLeftInGameSession.calls.mostRecent().args[0];
            const mockData = { session: {} as any, playerName: 'Other Player', playerId: 'player2' };
            callback(mockData);
            expect(mockNotificationService.showInfoToast).toHaveBeenCalledWith('Other Player a abandonné la partie');
        });

        it('should not show toast when current player left', () => {
            const callback = mockInGameSocketService.onPlayerLeftInGameSession.calls.mostRecent().args[0];
            const mockData = { session: {} as any, playerName: 'Current Player', playerId: 'player1' };
            callback(mockData);
            expect(mockNotificationService.showInfoToast).not.toHaveBeenCalled();
        });

        it('should handle player moved for current player', () => {
            service.updateInGameSession({ inGamePlayers: { player1: mockPlayer } });
            const callback = mockInGameSocketService.onPlayerMoved.calls.mostRecent().args[0];
            const mockData = { playerId: 'player1', x: 5, y: 10, speed: 3 };
            callback(mockData);
            expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ x: 5, y: 10, speed: 3 });
        });

        it('should handle player moved for other player', () => {
            service.updateInGameSession({ inGamePlayers: { player2: { ...mockPlayer, id: 'player2' } } });
            const callback = mockInGameSocketService.onPlayerMoved.calls.mostRecent().args[0];
            const mockData = { playerId: 'player2', x: 5, y: 10, speed: 3 };
            callback(mockData);
            expect(mockPlayerService.updatePlayer).not.toHaveBeenCalled();
        });

        it('should handle available actions for current player turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false }
            });
            const callback = mockInGameSocketService.onPlayerAvailableActions.calls.mostRecent().args[0];
            const mockActions = [{ type: 'move' }] as any;
            callback(mockActions);
            expect(service.availableActions()).toEqual(mockActions);
            expect(mockPlayerService.updateActionsRemaining).toHaveBeenCalledWith(1);
        });

        it('should handle available actions for other player turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player2', hasUsedAction: false }
            });
            const callback = mockInGameSocketService.onPlayerAvailableActions.calls.mostRecent().args[0];
            const mockActions = [{ type: 'move' }] as any;
            callback(mockActions);
            expect(service.availableActions()).toEqual(mockActions);
            expect(mockPlayerService.updateActionsRemaining).not.toHaveBeenCalled();
        });

        it('should handle left in-game session ack', () => {
            const callback = mockInGameSocketService.onLeftInGameSessionAck.calls.mostRecent().args[0];
            callback();
            expect(mockNotificationService.displayInformationPopup).toHaveBeenCalledWith({
                title: 'Départ réussi',
                message: 'Tu as quitté la partie avec succès',
                redirectRoute: ROUTES.HomePage
            });
        });

        it('should handle game force stopped', () => {
            const callback = mockInGameSocketService.onGameForceStopped.calls.mostRecent().args[0];
            callback();
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Partie terminée par défaut',
                message: 'Il n\'y a plus assez de joueurs pour continuer la partie, la partie est terminée',
                redirectRoute: ROUTES.HomePage
            });
        });

        it('should handle player reachable tiles', () => {
            const callback = mockInGameSocketService.onPlayerReachableTiles.calls.mostRecent().args[0];
            const mockTiles = [{ x: 1, y: 1 }] as any;
            callback(mockTiles);
            expect(service.reachableTiles()).toEqual(mockTiles);
        });

        it('should handle player teleported for current player', () => {
            service.updateInGameSession({ inGamePlayers: { player1: mockPlayer } });
            const callback = mockInGameSocketService.onPlayerTeleported.calls.mostRecent().args[0];
            const mockData = { playerId: 'player1', x: 5, y: 10 };
            callback(mockData);
            expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ x: 5, y: 10 });
        });

        it('should handle player action used', () => {
            service.activateActionMode();
            const callback = mockInGameSocketService.onPlayerActionUsed.calls.mostRecent().args[0];
            callback();
            expect(service.hasUsedAction()).toBe(true);
            expect(service.isActionModeActive()).toBe(false);
        });

        it('should handle game over', () => {
            jasmine.clock().install();
            const callback = mockInGameSocketService.onGameOver.calls.mostRecent().args[0];
            const mockData = { winnerId: 'player1', winnerName: 'Winner' };
            callback(mockData);
            expect(service.gameOverData()).toEqual(mockData);
            expect(mockTimerCoordinatorService.stopTurnTimer).toHaveBeenCalled();
            jasmine.clock().uninstall();
        });
    });
});