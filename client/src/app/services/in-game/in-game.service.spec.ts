/* eslint-disable max-lines -- Extensive tests needed for 100% code coverage */
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AvailableActionDto } from '@app/dto/available-action-dto';
import { AvailableActionsDto } from '@app/dto/available-actions-dto';
import { FlagPickedUpDto } from '@app/dto/flag-picked-up-dto';
import { FlagTransferRequestDto } from '@app/dto/flag-transfer-request-dto';
import { FlagTransferResultDto } from '@app/dto/flag-transfer-result-dto';
import { FlagTransferredDto } from '@app/dto/flag-transferred-dto';
import { OpenSanctuaryDto } from '@app/dto/open-sanctuary-dto';
import { PlayerBoardedBoatDto } from '@app/dto/player-boarded-boat-dto';
import { PlayerBonusesChangedDto } from '@app/dto/player-bonuses-changed-dto';
import { PlayerDisembarkedBoatDto } from '@app/dto/player-disembarked-boat-dto';
import { ROUTES } from '@app/enums/routes.enum';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { TimerService } from '@app/services/timer/timer.service';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Player } from '@common/interfaces/player.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { InGameService } from './in-game.service';

const TEST_TIMER_DURATION = 30;
const TEST_X_COORDINATE = 5;
const TEST_Y_COORDINATE = 10;

describe('InGameService', () => {
    let service: InGameService;
    let mockInGameSocketService: jasmine.SpyObj<InGameSocketService>;
    let mockSessionService: jasmine.SpyObj<SessionService>;
    let mockTimerService: jasmine.SpyObj<TimerService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;

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
        baseDefense: 4,
        defenseBonus: 0,
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
        hasCombatBonus: false,
        boatSpeedBonus: 0,
        boatSpeed: 0,
    };

    beforeEach(() => {
        mockInGameSocketService = jasmine.createSpyObj('InGameSocketService', [
            'playerJoinInGameSession',
            'playerLeaveInGameSession',
            'playerStartGame',
            'playerMove',
            'playerEndTurn',
            'playerToggleDoorAction',
            'playerSanctuaryRequest',
            'playerSanctuaryAction',
            'requestFlagTransfer',
            'respondToFlagTransfer',
            'onPlayerJoinedInGameSession',
            'onGameStarted',
            'onTurnStarted',
            'onTurnEnded',
            'onTurnTransitionEnded',
            'onPlayerLeftInGameSession',
            'onPlayerMoved',
            'onPlayerAvailableActions',
            'onLeftInGameSessionAck',
            'onOpenSanctuary',
            'onOpenSanctuaryError',
            'onSanctuaryActionFailed',
            'onSanctuaryActionSuccess',
            'onGameForceStopped',
            'onPlayerReachableTiles',
            'onPlayerTeleported',
            'onPlayerActionUsed',
            'onPlayerBonusesChanged',
            'onPlayerBoardedBoat',
            'onPlayerDisembarkedBoat',
            'onGameOver',
            'onSessionUpdated',
            'onFlagPickedUp',
            'onFlagTransferRequested',
            'onFlagTransferResult',
            'onFlagTransferred',
            'onFlagTransferRequestsCleared',
        ]);

        // eslint-disable-next-line @typescript-eslint/no-empty-function -- Noop function
        const noop = () => {};
        [
            'onSessionUpdated',
            'onFlagPickedUp',
            'onFlagTransferRequested',
            'onFlagTransferResult',
            'onFlagTransferred',
            'onFlagTransferRequestsCleared',
        ].forEach((method) => {
            (mockInGameSocketService[method as keyof InGameSocketService] as jasmine.Spy).and.callFake(() => {
                noop();
            });
        });

        mockSessionService = jasmine.createSpyObj('SessionService', [], {
            id: signal('session1'),
        });

        mockTimerService = jasmine.createSpyObj('TimerService', ['startTurnTimer', 'stopTurnTimer', 'resetAllTimers'], {
            turnTimeRemaining: signal(TEST_TIMER_DURATION),
        });

        mockPlayerService = jasmine.createSpyObj('PlayerService', ['updateActionsRemaining', 'updatePlayer', 'boatAction']);
        Object.defineProperty(mockPlayerService, 'id', {
            value: signal('player1'),
            configurable: true,
        });

        mockNotificationService = jasmine.createSpyObj('NotificationService', ['displayErrorPopup', 'displayInformationPopup', 'showInfoToast']);

        TestBed.configureTestingModule({
            providers: [
                { provide: InGameSocketService, useValue: mockInGameSocketService },
                { provide: SessionService, useValue: mockSessionService },
                { provide: TimerService, useValue: mockTimerService },
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: NotificationService, useValue: mockNotificationService },
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
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });
            expect(service.isMyTurn()).toBe(true);
        });

        it('should get active player', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
                inGamePlayers: { player1: mockPlayer },
            });
            expect(service.activePlayer).toEqual(mockPlayer);
        });

        it('should get currently playing players', () => {
            const inactivePlayers = { ...mockPlayer, isInGame: false };
            service.updateInGameSession({
                inGamePlayers: { player1: mockPlayer, player2: inactivePlayers },
            });
            expect(service.currentlyPlayers).toEqual([mockPlayer]);
        });

        it('should get turn transition message for my turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });
            expect(service.turnTransitionMessage).toBe("C'est ton tour !");
        });

        it('should get turn transition message for other player turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player2', hasUsedAction: false },
                inGamePlayers: { player2: { ...mockPlayer, id: 'player2', name: 'Other Player' } },
            });
            expect(service.turnTransitionMessage).toBe("C'est le tour de Other Player !");
        });
    });

    describe('Game Actions', () => {
        it('should toggle door action', () => {
            service.toggleDoorAction(TEST_X_COORDINATE, TEST_Y_COORDINATE);
            expect(mockInGameSocketService.playerToggleDoorAction).toHaveBeenCalledWith({
                sessionId: 'session1',
                x: TEST_X_COORDINATE,
                y: TEST_Y_COORDINATE,
            });
        });

        it('should activate action mode', () => {
            service.activateActionMode();
            expect(service.isActionModeActive()).toBe(true);
        });

        it('should deactivate action mode', () => {
            service.activateActionMode();
            service.deactivateActionMode();
            expect(service.isActionModeActive()).toBe(false);
        });

        it('should reset actions', () => {
            service.activateActionMode();
            service.resetActions();
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
                configurable: true,
            });
            service.loadInGameSession();
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Session non trouvée',
                message: "Vous n'êtes connecté à aucune session",
                redirectRoute: ROUTES.HomePage,
            });
        });

        it('should leave game', () => {
            service.leaveGame();
            expect(mockInGameSocketService.playerLeaveInGameSession).toHaveBeenCalledWith('session1');
        });

        it('should move player when conditions are met', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
                isGameStarted: true,
            });
            service.movePlayer(Orientation.N);
            expect(mockInGameSocketService.playerMove).toHaveBeenCalledWith({ sessionId: 'session1', orientation: Orientation.N });
        });

        it('should not move player when not my turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player2', hasUsedAction: false },
                isGameStarted: true,
            });
            service.movePlayer(Orientation.N);
            expect(mockInGameSocketService.playerMove).not.toHaveBeenCalled();
        });

        it('should not move player when game not started', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
                isGameStarted: false,
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
                inGamePlayers: { player1: mockPlayer },
            });
            expect(service.getPlayerByPlayerId('player1')).toEqual(mockPlayer);
        });

        it('should update in-game session', () => {
            service.updateInGameSession({ isGameStarted: true });
            expect(service.isGameStarted()).toBe(true);
        });
    });

    describe('Reset', () => {
        it('should reset all state', () => {
            service.reset();
            expect(mockTimerService.resetAllTimers).toHaveBeenCalled();
            expect(service.isGameStarted()).toBe(false);
            expect(service.isTransitioning()).toBe(false);
            expect(service.reachableTiles()).toEqual([]);
            expect(service.gameOverData()).toBeNull();
        });
    });

    describe('Socket Event Listeners', () => {
        it('should handle player joined in-game session', () => {
            const callback = mockInGameSocketService.onPlayerJoinedInGameSession.calls.mostRecent().args[0];
            const mockData = { id: 'session1' } as Partial<InGameSession>;
            callback(mockData as InGameSession);
            expect(service.inGameSession().id).toBe('session1');
        });

        it('should handle game started', () => {
            const callback = mockInGameSocketService.onGameStarted.calls.mostRecent().args[0];
            const mockData = { isGameStarted: true } as Partial<InGameSession>;
            callback(mockData as InGameSession);
            expect(service.isGameStarted()).toBe(true);
            expect(mockTimerService.startTurnTimer).toHaveBeenCalled();
        });

        it('should handle turn started', () => {
            const callback = mockInGameSocketService.onTurnStarted.calls.mostRecent().args[0];
            const mockData = { isGameStarted: true } as Partial<InGameSession>;
            callback(mockData as InGameSession);
            expect(service.isGameStarted()).toBe(true);
            expect(mockTimerService.startTurnTimer).toHaveBeenCalled();
        });

        it('should handle turn ended', () => {
            const callback = mockInGameSocketService.onTurnEnded.calls.mostRecent().args[0];
            const mockData = { currentTurn: { turnNumber: 2, activePlayerId: 'player2', hasUsedAction: false } } as Partial<InGameSession>;
            callback(mockData as InGameSession);
            expect(service.isTransitioning()).toBe(true);
        });

        it('should handle turn transition ended', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });
            service['_isTransitioning'].set(true);
            const callback = mockInGameSocketService.onTurnTransitionEnded.calls.mostRecent().args[0];

            callback();

            expect(mockTimerService.stopTurnTimer).toHaveBeenCalled();
            expect(service.isTransitioning()).toBe(false);
        });

        it('should handle player left for other player', () => {
            const callback = mockInGameSocketService.onPlayerLeftInGameSession.calls.mostRecent().args[0];
            const mockData = { session: {} as InGameSession, playerName: 'Other Player', playerId: 'player2' };
            callback(mockData);
            expect(mockNotificationService.showInfoToast).toHaveBeenCalledWith('Other Player a abandonné la partie');
        });

        it('should not show toast when current player left', () => {
            const callback = mockInGameSocketService.onPlayerLeftInGameSession.calls.mostRecent().args[0];
            const mockData = { session: {} as InGameSession, playerName: 'Current Player', playerId: 'player1' };
            callback(mockData);
            expect(mockNotificationService.showInfoToast).not.toHaveBeenCalled();
        });

        it('should handle player moved for current player', () => {
            service.updateInGameSession({ inGamePlayers: { player1: mockPlayer } });
            const callback = mockInGameSocketService.onPlayerMoved.calls.mostRecent().args[0];
            const mockData = { playerId: 'player1', x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE, speed: 3, boatSpeed: 0 };
            callback(mockData);
            expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE, speed: 3, boatSpeed: 0 });
        });

        it('should handle player moved for other player', () => {
            service.updateInGameSession({ inGamePlayers: { player2: { ...mockPlayer, id: 'player2' } } });
            const callback = mockInGameSocketService.onPlayerMoved.calls.mostRecent().args[0];
            const mockData = { playerId: 'player2', x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE, speed: 3, boatSpeed: 0 };
            Object.defineProperty(mockPlayerService, 'id', {
                value: signal('player1'),
                configurable: true,
            });
            mockPlayerService.updatePlayer.calls.reset();
            callback(mockData);
            expect(mockPlayerService.updatePlayer).not.toHaveBeenCalled();
        });

        it('should handle available actions for current player turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            });
            const callback = mockInGameSocketService.onPlayerAvailableActions.calls.mostRecent().args[0];
            const mockActions: AvailableActionDto[] = [{ type: AvailableActionType.ATTACK, x: 1, y: 1 }];
            const mockData: AvailableActionsDto = { availableActions: mockActions };
            callback(mockData);
            expect(service.availableActions()).toEqual(mockActions);
            expect(mockPlayerService.updateActionsRemaining).toHaveBeenCalledWith(1);
        });

        it('should handle available actions for other player turn', () => {
            service.updateInGameSession({
                currentTurn: { turnNumber: 1, activePlayerId: 'player2', hasUsedAction: false },
            });
            const callback = mockInGameSocketService.onPlayerAvailableActions.calls.mostRecent().args[0];
            const mockActions: AvailableActionDto[] = [{ type: AvailableActionType.ATTACK, x: 1, y: 1 }];
            const mockData: AvailableActionsDto = { availableActions: mockActions };
            mockPlayerService.updateActionsRemaining.calls.reset();
            callback(mockData);
            expect(service.availableActions()).toEqual(mockActions);
            expect(mockPlayerService.updateActionsRemaining).not.toHaveBeenCalled();
        });

        it('should handle left in-game session ack', () => {
            const callback = mockInGameSocketService.onLeftInGameSessionAck.calls.mostRecent().args[0];
            callback();
            expect(mockNotificationService.displayInformationPopup).toHaveBeenCalledWith({
                title: 'Départ réussi',
                message: 'Tu as quitté la partie avec succès',
                redirectRoute: ROUTES.HomePage,
            });
        });

        it('should handle game force stopped', () => {
            const callback = mockInGameSocketService.onGameForceStopped.calls.mostRecent().args[0];
            callback();
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Partie terminée par défaut',
                message: "Il n'y a plus assez de joueurs pour continuer la partie, la partie est terminée",
                redirectRoute: ROUTES.HomePage,
            });
        });

        it('should handle player reachable tiles', () => {
            const callback = mockInGameSocketService.onPlayerReachableTiles.calls.mostRecent().args[0];
            const mockTiles = [{ x: 1, y: 1, cost: 1, remainingPoints: 2 }] as ReachableTile[];
            callback(mockTiles);
            expect(service.reachableTiles()).toEqual(mockTiles);
        });

        it('should handle player teleported for current player', () => {
            service.updateInGameSession({ inGamePlayers: { player1: mockPlayer } });
            const callback = mockInGameSocketService.onPlayerTeleported.calls.mostRecent().args[0];
            const mockData = { playerId: 'player1', x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE };
            callback(mockData);
            expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE });
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
            expect(mockTimerService.stopTurnTimer).toHaveBeenCalled();
            jasmine.clock().uninstall();
        });

        it('should handle open sanctuary', () => {
            const callback = mockInGameSocketService.onOpenSanctuary.calls.mostRecent().args[0];
            const mockData: OpenSanctuaryDto = { kind: PlaceableKind.HEAL, x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE };
            callback(mockData);
            expect(service.openedSanctuary()).toEqual({ kind: PlaceableKind.HEAL, x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE, success: false });
        });

        it('should handle sanctuary action failed', () => {
            service['_openedSanctuary'].set({ kind: PlaceableKind.HEAL, x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE, success: false });
            const callback = mockInGameSocketService.onSanctuaryActionFailed.calls.mostRecent().args[0];
            const mockMessage = "L'action de sanctuaire a échouée";
            callback({ message: mockMessage });
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Action de sanctuaire échouée',
                message: mockMessage,
            });
            expect(service.openedSanctuary()).toBeNull();
        });

        it('should handle sanctuary action success', () => {
            const callback = mockInGameSocketService.onSanctuaryActionSuccess.calls.mostRecent().args[0];
            const mockData = {
                kind: PlaceableKind.HEAL,
                x: TEST_X_COORDINATE,
                y: TEST_Y_COORDINATE,
                success: true,
                addedHealth: 2,
            };
            callback(mockData);
            expect(service.openedSanctuary()).toEqual(mockData);
        });

        it('should handle player bonuses changed', () => {
            const callback = mockInGameSocketService.onPlayerBonusesChanged.calls.mostRecent().args[0];
            const mockData: PlayerBonusesChangedDto = { attackBonus: 1, defenseBonus: 2 };
            callback(mockData);
            expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ attackBonus: 1, defenseBonus: 2 });
        });

        it('should handle open sanctuary error', () => {
            const callback = mockInGameSocketService.onOpenSanctuaryError.calls.mostRecent().args[0];
            const mockMessage = 'Error message';
            callback(mockMessage);
            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Action impossible',
                message: mockMessage,
            });
        });

        it('should handle player boarded boat', () => {
            service.updateInGameSession({ inGamePlayers: { player1: mockPlayer } });
            const callback = mockInGameSocketService.onPlayerBoardedBoat.calls.mostRecent().args[0];
            const mockData: PlayerBoardedBoatDto = { playerId: 'player1', boatId: 'boat1' };
            callback(mockData);
            expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ onBoatId: 'boat1' });
        });

        it('should handle player disembarked boat', () => {
            service.updateInGameSession({ inGamePlayers: { player2: { ...mockPlayer, id: 'player2' } } });
            const callback = mockInGameSocketService.onPlayerDisembarkedBoat.calls.mostRecent().args[0];
            const mockData: PlayerDisembarkedBoatDto = { playerId: 'player2' };
            callback(mockData);
            const players = service.inGamePlayers();
            expect(players['player2'].onBoatId).toBeUndefined();
        });

        it('should handle session updated', () => {
            const callback = mockInGameSocketService.onSessionUpdated.calls.mostRecent().args[0];
            const mockData = { isGameStarted: true } as Partial<InGameSession>;
            callback(mockData as InGameSession);
            expect(service.isGameStarted()).toBe(true);
        });

        it('should handle flag picked up', () => {
            service.updateInGameSession({
                flagData: { position: { x: 0, y: 0 }, holderPlayerId: null },
            });
            const callback = mockInGameSocketService.onFlagPickedUp.calls.mostRecent().args[0];
            const mockData: FlagPickedUpDto = { playerId: 'player1' };
            callback(mockData);
            expect(service.flagData()?.holderPlayerId).toBe('player1');
        });

        it('should not update flag when flagData is undefined', () => {
            service.updateInGameSession({
                flagData: undefined,
            });
            const callback = mockInGameSocketService.onFlagPickedUp.calls.mostRecent().args[0];
            const mockData: FlagPickedUpDto = { playerId: 'player1' };
            callback(mockData);
            expect(service.flagData()).toBeUndefined();
        });

        it('should handle flag transfer requested for current player', () => {
            const callback = mockInGameSocketService.onFlagTransferRequested.calls.mostRecent().args[0];
            const mockData: FlagTransferRequestDto = {
                fromPlayerId: 'player2',
                toPlayerId: 'player1',
                fromPlayerName: 'Player 2',
            };
            callback(mockData);
            expect(service.pendingFlagTransferRequest()).toEqual(mockData);
        });

        it('should not set flag transfer request for other player', () => {
            const callback = mockInGameSocketService.onFlagTransferRequested.calls.mostRecent().args[0];
            const mockData: FlagTransferRequestDto = {
                fromPlayerId: 'player1',
                toPlayerId: 'player2',
                fromPlayerName: 'Player 1',
            };
            callback(mockData);
            expect(service.pendingFlagTransferRequest()).toBeNull();
        });

        it('should handle flag transfer result accepted', () => {
            const callback = mockInGameSocketService.onFlagTransferResult.calls.mostRecent().args[0];
            const mockData: FlagTransferResultDto = { toPlayerId: 'player1', accepted: true };
            callback(mockData);
            expect(mockNotificationService.showInfoToast).toHaveBeenCalledWith('Transfert de drapeau accepté');
        });

        it('should handle flag transfer result refused', () => {
            const callback = mockInGameSocketService.onFlagTransferResult.calls.mostRecent().args[0];
            const mockData: FlagTransferResultDto = { toPlayerId: 'player1', accepted: false };
            callback(mockData);
            expect(mockNotificationService.showInfoToast).toHaveBeenCalledWith('Transfert de drapeau refusé');
        });

        it('should handle flag transferred with toPlayer found', () => {
            const toPlayer = { ...mockPlayer, id: 'player2', x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE };
            service.updateInGameSession({
                flagData: { position: { x: 0, y: 0 }, holderPlayerId: 'player1' },
                inGamePlayers: { player2: toPlayer },
            });
            const callback = mockInGameSocketService.onFlagTransferred.calls.mostRecent().args[0];
            const mockData: FlagTransferredDto = { fromPlayerId: 'player1', toPlayerId: 'player2' };
            callback(mockData);
            expect(service.flagData()?.holderPlayerId).toBe('player2');
            expect(service.flagData()?.position).toEqual({ x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE });
        });

        it('should handle flag transferred with toPlayer not found', () => {
            const originalPosition = { x: 0, y: 0 };
            service.updateInGameSession({
                flagData: { position: originalPosition, holderPlayerId: 'player1' },
            });
            const callback = mockInGameSocketService.onFlagTransferred.calls.mostRecent().args[0];
            const mockData: FlagTransferredDto = { fromPlayerId: 'player1', toPlayerId: 'player2' };
            callback(mockData);
            expect(service.flagData()?.holderPlayerId).toBe('player2');
            expect(service.flagData()?.position).toEqual(originalPosition);
        });

        it('should not update flag when flagData is undefined in flag transferred', () => {
            service.updateInGameSession({
                flagData: undefined,
            });
            const callback = mockInGameSocketService.onFlagTransferred.calls.mostRecent().args[0];
            const mockData: FlagTransferredDto = { fromPlayerId: 'player1', toPlayerId: 'player2' };
            callback(mockData);
            expect(service.flagData()).toBeUndefined();
        });

        it('should handle flag transfer requests cleared when request exists', () => {
            service['_pendingFlagTransferRequest'].set({
                fromPlayerId: 'player2',
                toPlayerId: 'player1',
                fromPlayerName: 'Player 2',
            });
            const callback = mockInGameSocketService.onFlagTransferRequestsCleared.calls.mostRecent().args[0];
            callback();
            expect(service.pendingFlagTransferRequest()).toBeNull();
        });

        it('should not clear flag transfer request when request is null', () => {
            service['_pendingFlagTransferRequest'].set(null);
            const callback = mockInGameSocketService.onFlagTransferRequestsCleared.calls.mostRecent().args[0];
            callback();
            expect(service.pendingFlagTransferRequest()).toBeNull();
        });
    });

    describe('Sanctuary Actions', () => {
        it('should heal player', () => {
            service.healPlayer(TEST_X_COORDINATE, TEST_Y_COORDINATE);
            expect(mockInGameSocketService.playerSanctuaryRequest).toHaveBeenCalledWith({
                sessionId: 'session1',
                x: TEST_X_COORDINATE,
                y: TEST_Y_COORDINATE,
                kind: PlaceableKind.HEAL,
            });
        });

        it('should fight player', () => {
            service.fightPlayer(TEST_X_COORDINATE, TEST_Y_COORDINATE);
            expect(mockInGameSocketService.playerSanctuaryRequest).toHaveBeenCalledWith({
                sessionId: 'session1',
                x: TEST_X_COORDINATE,
                y: TEST_Y_COORDINATE,
                kind: PlaceableKind.FIGHT,
            });
        });

        it('should close sanctuary', () => {
            service['_openedSanctuary'].set({ kind: PlaceableKind.HEAL, x: TEST_X_COORDINATE, y: TEST_Y_COORDINATE, success: false });
            service.closeSanctuary();
            expect(service.openedSanctuary()).toBeNull();
        });

        it('should perform sanctuary action without double', () => {
            service.performSanctuaryAction(TEST_X_COORDINATE, TEST_Y_COORDINATE, PlaceableKind.HEAL);
            expect(mockInGameSocketService.playerSanctuaryAction).toHaveBeenCalledWith({
                sessionId: 'session1',
                x: TEST_X_COORDINATE,
                y: TEST_Y_COORDINATE,
                kind: PlaceableKind.HEAL,
                double: false,
            });
        });

        it('should perform sanctuary action with double', () => {
            const doubleValue = true;
            service.performSanctuaryAction(TEST_X_COORDINATE, TEST_Y_COORDINATE, PlaceableKind.HEAL, doubleValue);
            expect(mockInGameSocketService.playerSanctuaryAction).toHaveBeenCalledWith({
                sessionId: 'session1',
                x: TEST_X_COORDINATE,
                y: TEST_Y_COORDINATE,
                kind: PlaceableKind.HEAL,
                double: doubleValue,
            });
        });
    });

    describe('Flag Actions', () => {
        it('should request flag transfer', () => {
            service.requestFlagTransfer(TEST_X_COORDINATE, TEST_Y_COORDINATE);
            expect(mockInGameSocketService.requestFlagTransfer).toHaveBeenCalledWith({
                sessionId: 'session1',
                x: TEST_X_COORDINATE,
                y: TEST_Y_COORDINATE,
            });
        });

        it('should respond to flag transfer', () => {
            const mockFromPlayerId = 'player2';
            const mockAccepted = true;
            service['_pendingFlagTransferRequest'].set({
                fromPlayerId: mockFromPlayerId,
                toPlayerId: 'player1',
                fromPlayerName: 'Player 2',
            });
            service.respondToFlagTransfer(mockFromPlayerId, mockAccepted);
            expect(mockInGameSocketService.respondToFlagTransfer).toHaveBeenCalledWith({
                sessionId: 'session1',
                fromPlayerId: mockFromPlayerId,
                accepted: mockAccepted,
            });
            expect(service.pendingFlagTransferRequest()).toBeNull();
        });
    });

    describe('Boat Actions', () => {
        it('should perform boat action', () => {
            service.boatAction(TEST_X_COORDINATE, TEST_Y_COORDINATE);
            expect(mockPlayerService.boatAction).toHaveBeenCalledWith(TEST_X_COORDINATE, TEST_Y_COORDINATE);
        });
    });

    describe('Computed Properties', () => {
        it('should return turn number', () => {
            const mockTurnNumber = 5;
            service.updateInGameSession({
                currentTurn: { turnNumber: mockTurnNumber, activePlayerId: 'player1', hasUsedAction: false },
            });
            expect(service.turnNumber()).toBe(mockTurnNumber);
        });

        it('should return turn order', () => {
            const mockTurnOrder = ['player1', 'player2'];
            service.updateInGameSession({
                turnOrder: mockTurnOrder,
            });
            expect(service.turnOrder()).toEqual(mockTurnOrder);
        });

        it('should return start points', () => {
            const mockStartPoints = [{ id: 'start1', playerId: 'player1', x: 0, y: 0 }];
            service.updateInGameSession({
                startPoints: mockStartPoints,
            });
            expect(service.startPoints()).toEqual(mockStartPoints);
        });

        it('should return map size', () => {
            const mockMapSize = 10;
            service.updateInGameSession({
                mapSize: mockMapSize,
            });
            expect(service.mapSize()).toBe(mockMapSize);
        });

        it('should return mode', () => {
            const mockMode = GameMode.CLASSIC;
            service.updateInGameSession({
                mode: mockMode,
            });
            expect(service.mode()).toBe(mockMode);
        });

        it('should return time remaining', () => {
            expect(service.timeRemaining()).toBe(TEST_TIMER_DURATION);
        });

        it('should return flag data', () => {
            const mockFlagData = { position: { x: 1, y: 1 }, holderPlayerId: 'player1' };
            service.updateInGameSession({
                flagData: mockFlagData,
            });
            expect(service.flagData()).toEqual(mockFlagData);
        });
    });
});
