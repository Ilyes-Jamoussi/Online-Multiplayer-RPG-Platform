import { inject, Injectable, computed, signal } from '@angular/core';
import { DEFAULT_IN_GAME_SESSION } from '@app/constants/session.constants';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { TimerService } from '@app/services/timer/timer.service';
import { ToastService } from '@app/services/toast/toast.service';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { Orientation } from '@common/enums/orientation.enum';
import { ROUTES } from '@common/enums/routes.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { Player } from '@common/models/player.interface';
import { InGameSession } from '@common/models/session.interface';

const GAME_OVER_REDIRECT_DELAY = 10000;

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
    readonly currentTurn = computed(() => this._inGameSession().currentTurn);
    readonly turnNumber = computed(() => this._inGameSession().currentTurn.turnNumber);
    readonly turnOrder = computed(() => this._inGameSession().turnOrder);
    readonly startPoints = computed(() => this._inGameSession().startPoints);
    readonly mapSize = computed(() => this._inGameSession().mapSize);
    readonly mode = computed(() => this._inGameSession().mode);
    readonly isGameStarted = computed(() => this._inGameSession().isGameStarted);
    readonly isTransitioning = computed(() => this._isTransitioning());
    readonly timeRemaining = computed(() => this.timerService.turnTimeRemaining());
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
        this.inGameSocketService.playerToggleDoorAction(this.sessionService.id(), x, y);
    }

    playerActionUsed(): void {
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

    private readonly toastService = inject(ToastService);

    constructor(
        private readonly inGameSocketService: InGameSocketService,
        private readonly sessionService: SessionService,
        private readonly timerService: TimerService,
        private readonly playerService: PlayerService,
        private readonly notificationService: NotificationService,
    ) {
        this.initListeners();
    }

    get activePlayer(): Player | undefined {
        return this.getPlayerByPlayerId(this.currentTurn().activePlayerId);
    }

    get currentlyPlayers(): Player[] {
        return Object.values(this.inGamePlayers()).filter((p) => p.isInGame);
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
            this.notificationService.displayError({
                title: 'Session non trouvée',
                message: `Vous n'êtes connecté à aucune session`,
                redirectRoute: ROUTES.HomePage,
            });
        }
    }

    leaveGame(): void {
        this.inGameSocketService.playerLeaveInGameSession(this.sessionService.id());
    }

    startGame(): void {
        this.inGameSocketService.playerStartGame(this.sessionService.id());
    }

    movePlayer(orientation: Orientation): void {
        if (!this.isMyTurn() || !this.isGameStarted()) return;
        this.inGameSocketService.playerMove(this.sessionService.id(), orientation);
    }

    endTurn(): void {
        this.inGameSocketService.playerEndTurn(this.sessionService.id());
    }

    updateInGameSession(data: Partial<InGameSession>): void {
        this._inGameSession.update((inGameSession) => ({ ...inGameSession, ...data }));
    }

    startTurnTimer(): void {
        this.timerService.startTurnTimer(DEFAULT_TURN_DURATION);
    }

    stopTurnTimer(): void {
        this.timerService.stopTurnTimer();
    }

    startTurnTransitionTimer(): void {
        this.timerService.startTurnTimer(DEFAULT_TURN_TRANSITION_DURATION);
    }

    turnEnd(data: InGameSession): void {
        this.updateInGameSession(data);
        this.stopTurnTimer();
        this.startTurnTransitionTimer();
        this._isTransitioning.set(true);
    }

    turnTransitionEnded(): void {
        this._isTransitioning.set(false);
    }

    reset(): void {
        this.timerService.resetAllTimers();
        this._isGameStarted.set(false);
        this._isTransitioning.set(false);
        this._reachableTiles.set([]);
        this._inGameSession.set(DEFAULT_IN_GAME_SESSION);
        this._gameOverData.set(null);
    }

    private initListeners(): void {
        this.inGameSocketService.onPlayerJoinedInGameSession((data) => {
            this.updateInGameSession(data);
        });

        this.inGameSocketService.onGameStarted((data) => {
            this.updateInGameSession(data);
            this.startTurnTimer();
            this._isGameStarted.set(true);
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
            this.turnTransitionEnded();
        });

        this.inGameSocketService.onPlayerLeftInGameSession((data) => {
            this.updateInGameSession(data.session);
            if(this.playerService.id() !== data.playerId) {
                this.toastService.info(`${data.playerName} a abandonné la partie`);
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
            this.notificationService.displayInformation({
                title: 'Départ réussi',
                message: `Tu as quitté la partie avec succès`,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.inGameSocketService.onGameForceStopped(() => {
            this.reset();
            this.notificationService.displayError({
                title: 'Partie terminée par défaut',
                message: `Il n'y a plus assez de joueurs pour continuer la partie, la partie est terminée`,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.inGameSocketService.onPlayerReachableTiles((data) => {
            this._reachableTiles.set(data);
        });

        this.inGameSocketService.onPlayerActionUsed(() => {
            this.playerActionUsed();
            this.deactivateActionMode();
        });

        this.inGameSocketService.onGameOver((data) => {
            this._gameOverData.set(data);
            this.stopTurnTimer();

            setTimeout(() => {
                this.reset();
                window.location.href = ROUTES.HomePage;
            }, GAME_OVER_REDIRECT_DELAY);
        });
    }
}
