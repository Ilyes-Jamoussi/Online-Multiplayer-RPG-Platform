import { Injectable, computed, signal, inject } from '@angular/core';
import { DEFAULT_IN_GAME_SESSION } from '@app/constants/session.constants';
import { ROUTES } from '@app/enums/routes.enum';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { TimerService } from '@app/services/timer/timer.service';
import { ResetService } from '@app/services/reset/reset.service';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { Orientation } from '@common/enums/orientation.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
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
    private readonly _availableActions = signal<AvailableAction[]>([]);
    private readonly _isActionModeActive = signal<boolean>(false);
    private readonly _gameOverData = signal<{ winnerId: string; winnerName: string } | null>(null);

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

    reset(): void {
        this.timerCoordinatorService.resetAllTimers();
        this._isGameStarted.set(false);
        this._isTransitioning.set(false);
        this._reachableTiles.set([]);
        this._inGameSession.set(DEFAULT_IN_GAME_SESSION);
        this._gameOverData.set(null);
        this._isActionModeActive.set(false);
        this._availableActions.set([]);
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
            this.updateInGameSession({
                inGamePlayers: {
                    ...this.inGameSession().inGamePlayers,
                    [data.playerId]: {
                        ...this.inGameSession().inGamePlayers[data.playerId],
                        x: data.x,
                        y: data.y,
                        speed: data.speed,
                    },
                },
            });
            if (this.playerService.id() === data.playerId) {
                this.playerService.updatePlayer({
                    x: data.x,
                    y: data.y,
                    speed: data.speed,
                });
            }
        });

        this.inGameSocketService.onPlayerAvailableActions((actions) => {
            this._availableActions.set(actions);
            if (this.isMyTurn()) {
                this.playerService.updateActionsRemaining(actions.length);
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
            this.updateInGameSession({
                inGamePlayers: {
                    ...this.inGameSession().inGamePlayers,
                    [data.playerId]: {
                        ...this.inGameSession().inGamePlayers[data.playerId],
                        x: data.x,
                        y: data.y,
                    },
                },
            });
            if (this.playerService.id() === data.playerId) {
                this.playerService.updatePlayer({
                    x: data.x,
                    y: data.y,
                });
            }
        });

        this.inGameSocketService.onPlayerActionUsed(() => {
            this.playerActionUsed();
            this.deactivateActionMode();
        });

        this.inGameSocketService.onGameOver((data) => {
            this._gameOverData.set(data);
            this.stopTurnTimer();
        });
    }
}
