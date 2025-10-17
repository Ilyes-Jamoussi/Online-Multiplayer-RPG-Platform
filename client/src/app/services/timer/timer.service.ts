import { Injectable, signal } from '@angular/core';
import { MILLISECONDS_PER_SECOND } from '@common/constants/in-game';

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
        this._timeRemaining.set(duration / MILLISECONDS_PER_SECOND);
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

