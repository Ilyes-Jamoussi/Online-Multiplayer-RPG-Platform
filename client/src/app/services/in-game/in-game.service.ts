import { Injectable, computed, inject, signal } from '@angular/core';
import { DEFAULT_IN_GAME_SESSION } from '@app/constants/session.constants';
import { AvailableActionDto } from '@app/dto/available-action-dto';
import { FlagTransferRequestDto } from '@app/dto/flag-transfer-request-dto';
import { ROUTES } from '@app/enums/routes.enum';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { PlayerService } from '@app/services/player/player.service';
import { ResetService } from '@app/services/reset/reset.service';
import { SessionService } from '@app/services/session/session.service';
import { TimerService } from '@app/services/timer/timer.service';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Player } from '@common/interfaces/player.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';

@Injectable({
    providedIn: 'root',
})
export class InGameService {
    private readonly _inGameSession = signal<InGameSession>(DEFAULT_IN_GAME_SESSION);
    private readonly _isTransitioning = signal<boolean>(false);
    private readonly _isGameStarted = signal<boolean>(false);
    private readonly _reachableTiles = signal<ReachableTile[]>([]);
    private readonly _availableActions = signal<AvailableActionDto[]>([]);
    private readonly _isActionModeActive = signal<boolean>(false);
    private readonly _gameOverData = signal<{ winnerId: string; winnerName: string } | null>(null);
    private readonly _openedSanctuary = signal<{
        kind: PlaceableKind;
        x: number;
        y: number;
        success: boolean;
        addedHealth?: number;
        addedDefense?: number;
        addedAttack?: number;
    } | null>(null);
    private readonly _pendingFlagTransferRequest = signal<FlagTransferRequestDto | null>(null);

    readonly isMyTurn = computed(() => this._inGameSession().currentTurn.activePlayerId === this.playerService.id());
    private readonly currentTurn = computed(() => this._inGameSession().currentTurn);
    readonly turnNumber = computed(() => this._inGameSession().currentTurn.turnNumber);
    readonly turnOrder = computed(() => this._inGameSession().turnOrder);
    readonly startPoints = computed(() => this._inGameSession().startPoints);
    readonly mapSize = computed(() => this._inGameSession().mapSize);
    readonly mode = computed(() => this._inGameSession().mode);
    readonly isGameStarted = computed(() => this._inGameSession().isGameStarted);
    readonly isTransitioning = computed(() => this._isTransitioning());
    readonly timeRemaining = computed(() => this.timerCoordinatorService.turnTimeRemaining());
    readonly inGamePlayers = computed(() => this._inGameSession().inGamePlayers);
    readonly inGameSession = this._inGameSession.asReadonly();
    readonly reachableTiles = this._reachableTiles.asReadonly();
    readonly hasUsedAction = computed(() => this._inGameSession().currentTurn.hasUsedAction);
    readonly availableActions = this._availableActions.asReadonly();
    readonly isActionModeActive = this._isActionModeActive.asReadonly();
    readonly gameOverData = this._gameOverData.asReadonly();
    readonly openedSanctuary = this._openedSanctuary.asReadonly();
    readonly flagData = computed(() => this._inGameSession().flagData);
    readonly pendingFlagTransferRequest = this._pendingFlagTransferRequest.asReadonly();

    sessionId(): string {
        return this.sessionService.id();
    }

    toggleDoorAction(x: number, y: number): void {
        this.inGameSocketService.playerToggleDoorAction({ sessionId: this.sessionService.id(), x, y });
    }

    private playerActionUsed(): void {
        this._inGameSession.update((session) => ({
            ...session,
            currentTurn: {
                ...session.currentTurn,
                hasUsedAction: true,
            },
        }));
        this.playerService.updateActionsRemaining(0);
    }

    activateActionMode(): void {
        this._isActionModeActive.set(true);
    }

    deactivateActionMode(): void {
        this._isActionModeActive.set(false);
        this._availableActions.set([]);
    }

    constructor(
        private readonly inGameSocketService: InGameSocketService,
        private readonly sessionService: SessionService,
        private readonly timerCoordinatorService: TimerService,
        private readonly playerService: PlayerService,
        private readonly notificationCoordinatorService: NotificationService,
    ) {
        this.initListeners();
        inject(ResetService).reset$.subscribe(() => this.reset());
    }

    get activePlayer(): Player | undefined {
        return this.getPlayerByPlayerId(this.currentTurn().activePlayerId);
    }

    get currentlyPlayers(): Player[] {
        return Object.values(this.inGamePlayers()).filter((player) => player.isInGame);
    }

    get turnTransitionMessage(): string {
        return this.isMyTurn() ? "C'est ton tour !" : `C'est le tour de ${this.activePlayer?.name} !`;
    }

    getPlayerByPlayerId(playerId: string): Player {
        return this.inGamePlayers()[playerId];
    }

    loadInGameSession(): void {
        if (this.sessionService.id()) {
            this.inGameSocketService.playerJoinInGameSession(this.sessionService.id());
        } else {
            this.reset();
            this.notificationCoordinatorService.displayErrorPopup({
                title: 'Session non trouvée',
                message: `Vous n'êtes connecté à aucune session`,
                redirectRoute: ROUTES.HomePage,
            });
        }
    }

    leaveGame(): void {
        this.inGameSocketService.playerLeaveInGameSession(this.sessionService.id());
    }

    movePlayer(orientation: Orientation): void {
        if (!this.isMyTurn() || !this.isGameStarted()) return;
        this.inGameSocketService.playerMove({ sessionId: this.sessionService.id(), orientation });
    }

    endTurn(): void {
        this.inGameSocketService.playerEndTurn(this.sessionService.id());
    }

    updateInGameSession(data: Partial<InGameSession>): void {
        this._inGameSession.update((inGameSession) => ({ ...inGameSession, ...data }));
        if (data.inGamePlayers) {
            const currentPlayerId = this.playerService.id();
            const updatedPlayer = data.inGamePlayers[currentPlayerId];
            if (updatedPlayer) {
                this.playerService.updatePlayer(updatedPlayer);
            }
        }
    }

    healPlayer(x: number, y: number): void {
        this.inGameSocketService.playerSanctuaryRequest({ sessionId: this.sessionService.id(), x, y, kind: PlaceableKind.HEAL });
    }

    fightPlayer(x: number, y: number): void {
        this.inGameSocketService.playerSanctuaryRequest({ sessionId: this.sessionService.id(), x, y, kind: PlaceableKind.FIGHT });
    }

    closeSanctuary(): void {
        this._openedSanctuary.set(null);
    }

    performSanctuaryAction(x: number, y: number, kind: PlaceableKind, double: boolean = false): void {
        this.inGameSocketService.playerSanctuaryAction({ sessionId: this.sessionService.id(), x, y, kind, double });
    }

    private startTurnTimer(): void {
        this.timerCoordinatorService.startTurnTimer(DEFAULT_TURN_DURATION);
    }

    private stopTurnTimer(): void {
        this.timerCoordinatorService.stopTurnTimer();
    }

    private startTurnTransitionTimer(): void {
        this.timerCoordinatorService.startTurnTimer(DEFAULT_TURN_TRANSITION_DURATION);
    }

    private turnEnd(data: InGameSession): void {
        this.updateInGameSession(data);
        this.stopTurnTimer();
        this.startTurnTransitionTimer();
        this._isTransitioning.set(true);
    }

    private turnTransitionEnded(): void {
        this._isTransitioning.set(false);
    }

    private updatePlayerInSession(playerId: string, updates: Partial<Player>, updatePlayerService: boolean = false): void {
        this.updateInGameSession({
            inGamePlayers: {
                ...this.inGameSession().inGamePlayers,
                [playerId]: {
                    ...this.inGameSession().inGamePlayers[playerId],
                    ...updates,
                },
            },
        });
        if (updatePlayerService && this.playerService.id() === playerId) {
            this.playerService.updatePlayer(updates);
        }
    }

    boatAction(x: number, y: number): void {
        this.playerService.boatAction(x, y);
    }

    requestFlagTransfer(x: number, y: number): void {
        this.inGameSocketService.requestFlagTransfer({ sessionId: this.sessionService.id(), x, y });
    }

    respondToFlagTransfer(fromPlayerId: string, accepted: boolean): void {
        this.inGameSocketService.respondToFlagTransfer({
            sessionId: this.sessionService.id(),
            fromPlayerId,
            accepted,
        });
        this._pendingFlagTransferRequest.set(null);
    }

    reset(): void {
        this.timerCoordinatorService.resetAllTimers();
        this._isGameStarted.set(false);
        this._isTransitioning.set(false);
        this._reachableTiles.set([]);
        this._inGameSession.set(DEFAULT_IN_GAME_SESSION);
        this._gameOverData.set(null);
        this._isActionModeActive.set(false);
        this._availableActions.set([]);
        this._pendingFlagTransferRequest.set(null);
    }

    private initListeners(): void {
        this.inGameSocketService.onPlayerJoinedInGameSession((data) => {
            this.updateInGameSession(data);
        });

        this.inGameSocketService.onGameStarted((data) => {
            this.updateInGameSession(data);
            this._isGameStarted.set(true);
            this.startTurnTransitionTimer();
            this._isTransitioning.set(true);
        });

        this.inGameSocketService.onTurnStarted((data) => {
            this.updateInGameSession(data);
            this.startTurnTimer();
            this._isGameStarted.set(true);
        });

        this.inGameSocketService.onTurnEnded((data) => {
            this.turnEnd(data);
        });

        this.inGameSocketService.onTurnTransitionEnded(() => {
            this.stopTurnTimer();
            this.turnTransitionEnded();
        });

        this.inGameSocketService.onPlayerLeftInGameSession((data) => {
            this.updateInGameSession(data.session);
            if (this.playerService.id() !== data.playerId) {
                this.notificationCoordinatorService.showInfoToast(`${data.playerName} a abandonné la partie`);
            }
        });

        this.inGameSocketService.onPlayerMoved((data) => {
            const isCurrentPlayer = this.playerService.id() === data.playerId;
            this.updatePlayerInSession(data.playerId, { x: data.x, y: data.y, speed: data.speed, boatSpeed: data.boatSpeed }, isCurrentPlayer);
        });

        this.inGameSocketService.onPlayerAvailableActions((data) => {
            this._availableActions.set(data.availableActions);
            if (this.isMyTurn()) {
                this.playerService.updateActionsRemaining(data.availableActions.length);
            }
        });

        this.inGameSocketService.onLeftInGameSessionAck(() => {
            this.reset();
            this.notificationCoordinatorService.displayInformationPopup({
                title: 'Départ réussi',
                message: `Tu as quitté la partie avec succès`,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.inGameSocketService.onGameForceStopped(() => {
            this.reset();
            this.notificationCoordinatorService.displayErrorPopup({
                title: 'Partie terminée par défaut',
                message: `Il n'y a plus assez de joueurs pour continuer la partie, la partie est terminée`,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.inGameSocketService.onPlayerReachableTiles((data) => {
            this._reachableTiles.set(data);
        });

        this.inGameSocketService.onPlayerTeleported((data) => {
            this.updatePlayerInSession(data.playerId, { x: data.x, y: data.y }, true);
        });

        this.inGameSocketService.onPlayerActionUsed(() => {
            this.playerActionUsed();
            this.deactivateActionMode();
        });

        this.inGameSocketService.onGameOver((data) => {
            this._gameOverData.set(data);
            this.stopTurnTimer();
        });

        this.inGameSocketService.onOpenSanctuary((data) => {
            this._openedSanctuary.set({ kind: data.kind, x: data.x, y: data.y, success: false });
        });

        this.inGameSocketService.onSanctuaryActionFailed(() => {
            this.notificationCoordinatorService.displayErrorPopup({
                title: 'Action de sanctuaire échouée',
                message: `L'action de sanctuaire a échouée`,
            });
            this._openedSanctuary.set(null);
        });

        this.inGameSocketService.onSanctuaryActionSuccess((data) => {
            this._openedSanctuary.set(data);
        });

        this.inGameSocketService.onPlayerBonusesChanged((data) => {
            this.playerService.updatePlayer({
                attackBonus: data.attackBonus,
                defenseBonus: data.defenseBonus,
            });
        });

        this.inGameSocketService.onOpenSanctuaryError((message) => {
            this.notificationCoordinatorService.displayErrorPopup({
                title: 'Action impossible',
                message,
            });
        });

        this.inGameSocketService.onPlayerBoardedBoat((data) => {
            this.updatePlayerInSession(data.playerId, { onBoatId: data.boatId }, true);
        });

        this.inGameSocketService.onPlayerDisembarkedBoat((data) => {
            this.updatePlayerInSession(data.playerId, { onBoatId: undefined });
        });

        this.inGameSocketService.onSessionUpdated((data) => {
            this.updateInGameSession(data);
        });

        this.inGameSocketService.onFlagPickedUp((data) => {
            const currentFlagData = this.flagData();
            if (currentFlagData) {
                this.updateInGameSession({
                    flagData: { ...currentFlagData, holderPlayerId: data.playerId },
                });
            }
        });

        this.inGameSocketService.onFlagTransferRequested((data) => {
            if (this.playerService.id() === data.toPlayerId) {
                this._pendingFlagTransferRequest.set(data);
            }
        });

        this.inGameSocketService.onFlagTransferResult((data) => {
            if (data.accepted) {
                this.notificationCoordinatorService.showInfoToast(`Transfert de drapeau accepté`);
            } else {
                this.notificationCoordinatorService.showInfoToast(`Transfert de drapeau refusé`);
            }
        });

        this.inGameSocketService.onFlagTransferred((data) => {
            const currentFlagData = this.flagData();
            if (currentFlagData) {
                const toPlayer = this.inGamePlayers()[data.toPlayerId];
                this.updateInGameSession({
                    flagData: {
                        ...currentFlagData,
                        holderPlayerId: data.toPlayerId,
                        position: toPlayer ? { x: toPlayer.x, y: toPlayer.y } : currentFlagData.position,
                    },
                });
            }
        });

        this.inGameSocketService.onFlagTransferRequestsCleared(() => {
            if (this._pendingFlagTransferRequest()) {
                this._pendingFlagTransferRequest.set(null);
            }
        });
    }
}
