import { Injectable, signal } from '@angular/core';
import { MILLISECONDS_PER_SECOND } from '@common/constants/in-game';

@Injectable({
    providedIn: 'root',
})
export class TimerService {
    private readonly _turnTimeRemaining = signal<number>(0);
    private readonly _isTurnActive = signal<boolean>(false);

    private turnTimer: number | null = null;
    private pausedTurnTime: number = 0;

    readonly turnTimeRemaining = this._turnTimeRemaining.asReadonly();
    readonly isTurnActive = this._isTurnActive.asReadonly();

    getPausedTurnTime(): number {
        return this.pausedTurnTime;
    }

    startTurnTimer(duration: number): void {
        this.stopTurnTimer();
        const timeInSeconds = duration / MILLISECONDS_PER_SECOND;

        this._turnTimeRemaining.set(timeInSeconds);
        this._isTurnActive.set(true);

        this.turnTimer = window.setInterval(() => {
            const currentTime = this._turnTimeRemaining();
            if (currentTime <= 1) {
                this.stopTurnTimer();
            } else {
                this._turnTimeRemaining.set(currentTime - 1);
            }
        }, MILLISECONDS_PER_SECOND);
    }

    stopTurnTimer(): void {
        if (this.turnTimer) {
            window.clearInterval(this.turnTimer);
            this.turnTimer = null;
        }
        this._isTurnActive.set(false);
        this._turnTimeRemaining.set(0);
        this.pausedTurnTime = 0;
    }

    pauseTurnTimer(): void {
        if (this.turnTimer) {
            window.clearInterval(this.turnTimer);
            this.turnTimer = null;
        }

        if (this._isTurnActive() && this._turnTimeRemaining() > 0) {
            this.pausedTurnTime = this._turnTimeRemaining();
        }

        this._isTurnActive.set(false);
        this._turnTimeRemaining.set(0);
    }

    resumeTurnTimer(): void {
        if (this.pausedTurnTime > 0) {
            this._turnTimeRemaining.set(this.pausedTurnTime);
            this._isTurnActive.set(true);
            this.pausedTurnTime = 0;

            this.turnTimer = window.setInterval(() => {
                const currentTime = this._turnTimeRemaining();
                if (currentTime <= 1) {
                    this.stopTurnTimer();
                } else {
                    this._turnTimeRemaining.set(currentTime - 1);
                }
            }, MILLISECONDS_PER_SECOND);
        }
    }

    resetAllTimers(): void {
        this.stopTurnTimer();
    }
}
