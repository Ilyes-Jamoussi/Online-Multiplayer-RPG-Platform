import { Injectable, Signal, computed, signal } from '@angular/core';
import { DEFAULT_IN_GAME_SESSION } from '@app/constants/session.constants';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { InGamePlayer } from '@common/models/player.interface';
import { InGameSession } from '@common/models/session.interface';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerService } from '@app/services/player/player.service';
import { NotificationService } from '@app/services/notification/notification.service';

const MILLISECONDS_PER_SECOND = 1000;
const DEFAULT_TURN_DURATION = 30;

@Injectable({
    providedIn: 'root',
})
export class TimerService {
    private readonly _timeRemaining = signal<number>(0);
    private readonly _isActive = signal<boolean>(false);
    private timer: number | null = null;

    readonly timeRemaining = this._timeRemaining.asReadonly();
    readonly isActive = this._isActive.asReadonly();

    startTimer(duration: number): void {
        this.stopTimer();
        this._timeRemaining.set(duration);
        this._isActive.set(true);

        this.timer = window.setInterval(() => {
            const currentTime = this._timeRemaining();
            if (currentTime <= 1) {
                this.stopTimer();
                this._timeRemaining.set(0);
                this._isActive.set(false);
            } else {
                this._timeRemaining.set(currentTime - 1);
            }
        }, MILLISECONDS_PER_SECOND);
    }

    stopTimer(): void {
        if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
        this._isActive.set(false);
    }

    resetTimer(): void {
        this.stopTimer();
        this._timeRemaining.set(0);
    }
}

@Injectable({
    providedIn: 'root',
})
export class InGameService {
    private readonly _inGameSession = signal<InGameSession>(DEFAULT_IN_GAME_SESSION);

    readonly inGameSession = this._inGameSession.asReadonly();
    readonly id: Signal<string> = computed(() => this.inGameSession().id);
    readonly gameId: Signal<string> = computed(() => this.inGameSession().gameId);
    readonly sessionId: Signal<string> = computed(() => this.inGameSession().sessionId);
    readonly mapSize: Signal<MapSize> = computed(() => this.inGameSession().mapSize);
    readonly mode: Signal<GameMode> = computed(() => this.inGameSession().mode);
    readonly players: Signal<InGamePlayer[]> = computed(() => this.inGameSession().players);
    readonly startPoints: Signal<{ x: number; y: number; id: string; playerId: string }[]> = computed(() => this.inGameSession().startPoints);
    readonly turnOrderIndex: Signal<number[]> = computed(() => this.inGameSession().turnOrderIndex);
    readonly currentTurnIndex: Signal<number> = computed(() => this.inGameSession().currentTurnIndex);
    readonly activePlayerId: Signal<string> = computed(() => this.inGameSession().activePlayerId);

    constructor(
        private readonly inGameSocketService: InGameSocketService,
        private readonly sessionService: SessionService,
        private readonly timerService: TimerService,
        private readonly playerService: PlayerService,
        private readonly notificationService: NotificationService,
    ) {
        this.initListeners();
    }

    updateInGameSession(data: InGameSession): void {
        this._inGameSession.update((inGameSession) => ({ ...inGameSession, ...data }));
    }

    loadInGameSession(): void {
        this.inGameSocketService.playerJoinInGameSession(this.sessionService.id());
    }

    startTurn(): void {
        this.inGameSocketService.playerStartTurn(this.sessionService.id());
    }

    startTurnTimer(): void {
        const duration = DEFAULT_TURN_DURATION;
        this.timerService.startTimer(duration);
    }

    stopTurnTimer(): void {
        this.timerService.stopTimer();
    }

    get timeRemaining(): Signal<number> {
        return this.timerService.timeRemaining;
    }

    get isTimerActive(): Signal<boolean> {
        return this.timerService.isActive;
    }

    get isMyTurn(): boolean {
        return this.activePlayerId() === this.playerService.id();
    }

    turnEnd(data: InGameSession): void {
        this.updateInGameSession(data);
        this.stopTurnTimer();

        if (this.isMyTurn) {
            this.notificationService.displayInformation({
                title: "C'est à toi de jouer !",
                message: "Ton tour va commencer, c'est à toi de jouer !",
            });
        } else {
            const player = this.players().find((p) => p.id === data.activePlayerId);
            this.notificationService.displayInformation({
                title: "Tour terminé, c'est à " + player?.name + ' de jouer !',
                message: '',
            });
        }
    }

    private initListeners(): void {
        this.inGameSocketService.onPlayerJoinedInGameSession((data) => {
            this.updateInGameSession(data);
        });

        this.inGameSocketService.onTurnStarted(() => {
            this.startTurnTimer();
        });

        this.inGameSocketService.onTurnEnded((data) => {
            this.turnEnd(data);
        });
    }
}
