import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_IN_GAME_SESSION } from '@app/constants/session.constants';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { InGameSession } from '@common/models/session.interface';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerService } from '@app/services/player/player.service';
import { InGamePlayer } from '@common/models/player.interface';
import { TimerService } from '@app/services/timer/timer.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { Orientation } from '@common/enums/orientation.enum';
import { ROUTES } from '@app/constants/routes.constants';

@Injectable({
    providedIn: 'root',
})
export class InGameService {
    private readonly _inGameSession = signal<InGameSession>(DEFAULT_IN_GAME_SESSION);
    private readonly _isTransitioning = signal<boolean>(false);
    private readonly _isGameStarted = signal<boolean>(false);

    constructor(
        private readonly inGameSocketService: InGameSocketService,
        private readonly sessionService: SessionService,
        private readonly timerService: TimerService,
        private readonly playerService: PlayerService,
        private readonly notificationService: NotificationService,
    ) {
        this.initListeners();
    }

    readonly isMyTurn = computed(() => this._inGameSession().currentTurn.activePlayerId === this.playerService.id());
    readonly currentTurn = computed(() => this._inGameSession().currentTurn);
    readonly turnNumber = computed(() => this._inGameSession().currentTurn.turnNumber);
    readonly turnOrderPlayerId = computed(() => this._inGameSession().turnOrderPlayerId);
    readonly startPoints = computed(() => this._inGameSession().startPoints);
    readonly mapSize = computed(() => this._inGameSession().mapSize);
    readonly mode = computed(() => this._inGameSession().mode);
    readonly isGameStarted = computed(() => this._inGameSession().isGameStarted);
    readonly isTransitioning = computed(() => this._isTransitioning());
    readonly timeRemaining = computed(() => this.timerService.timeRemaining());
    readonly inGamePlayers = computed(() => this._inGameSession().inGamePlayers);

    get activePlayer(): InGamePlayer | undefined {
        return this.inGamePlayers()[this.currentTurn().activePlayerId];
    }

    get turnTransitionMessage(): string {
        return this.isMyTurn() ? "C'est ton tour !" : `C'est le tour de ${this.activePlayer?.name} !`;
    }

    updateInGameSession(data: InGameSession): void {
        this._inGameSession.update((inGameSession) => ({ ...inGameSession, ...data }));
    }

    updatePlayerPosition(playerId: string, x: number, y: number, movementPoints: number): void {
        this._inGameSession.update((inGameSession) => ({
            ...inGameSession,
            inGamePlayers: { ...inGameSession.inGamePlayers, [playerId]: { ...inGameSession.inGamePlayers[playerId], x, y, movementPoints } },
        }));
        if (this.isMyTurn()) {
            this.playerService.updatePlayer({
                x,
                y,
                movementPoints,
            });
        }
    }

    loadInGameSession(): void {
        this.inGameSocketService.playerJoinInGameSession(this.sessionService.id());
    }

    startGame(): void {
        this.inGameSocketService.playerStartGame(this.sessionService.id());
    }

    endTurn(): void {
        this.inGameSocketService.playerEndTurn(this.sessionService.id());
    }

    startTurnTimer(): void {
        this.timerService.startTimer(DEFAULT_TURN_DURATION);
    }

    stopTurnTimer(): void {
        this.timerService.stopTimer();
    }

    startTurnTransitionTimer(): void {
        this.timerService.startTimer(DEFAULT_TURN_TRANSITION_DURATION);
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

    cleanupAll(): void {
        this.timerService.resetTimer();
        this._isGameStarted.set(false);
        this._isTransitioning.set(false);
        this.inGameSocketService.playerLeaveInGameSession(this.sessionService.id());
        this.playerService.leaveSession();
    }

    movePlayer(orientation: Orientation): void {
        if (!this.isMyTurn() || !this.isGameStarted()) return;
        this.inGameSocketService.playerMove(this.sessionService.id(), orientation);
    }

    leaveGame(): void {
        this.inGameSocketService.playerLeaveInGameSession(this.sessionService.id());
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
            this.notificationService.displayInformation({
                title: 'Joueur parti',
                message: `${data.playerName} a abandonné la partie`,
            });
        });

        this.inGameSocketService.onPlayerMoved((data) => {
            this.updatePlayerPosition(data.playerId, data.x, data.y, data.movementPoints);
        });

        this.inGameSocketService.onLeftInGameSessionAck(() => {
            this.cleanupAll();
            this.notificationService.displayInformation({
                title: 'Départ réussi',
                message: `Tu as quitté la partie avec succès`,
                redirectRoute: ROUTES.homePage,
            });
        });
    }
}
