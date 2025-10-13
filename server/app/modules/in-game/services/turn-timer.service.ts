import { Injectable } from '@nestjs/common';

const MILLISECONDS_PER_SECOND = 1000;

@Injectable()
export class TurnTimerService {
    private readonly timers = new Map<string, NodeJS.Timeout>();
    private readonly timerStartTimes = new Map<string, number>();
    private readonly timerDurations = new Map<string, number>();

    startTurnTimer(sessionId: string, duration: number, onTimeout: () => void): void {
        this.clearTurnTimer(sessionId);

        const startTime = Date.now();
        this.timerStartTimes.set(sessionId, startTime);
        this.timerDurations.set(sessionId, duration);

        const timer = setTimeout(() => {
            onTimeout();
            this.timers.delete(sessionId);
            this.timerStartTimes.delete(sessionId);
            this.timerDurations.delete(sessionId);
        }, duration * MILLISECONDS_PER_SECOND);

        this.timers.set(sessionId, timer);
    }

    getRemainingTime(sessionId: string): number {
        if (!this.timers.has(sessionId)) {
            return 0;
        }

        const startTime = this.timerStartTimes.get(sessionId);
        const duration = this.timerDurations.get(sessionId);

        if (!startTime || !duration) {
            return 0;
        }

        const elapsedTime = Math.floor((Date.now() - startTime) / MILLISECONDS_PER_SECOND);
        const remainingTime = Math.max(0, duration - elapsedTime);

        return remainingTime;
    }

    clearTurnTimer(sessionId: string): void {
        const timer = this.timers.get(sessionId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(sessionId);
            this.timerStartTimes.delete(sessionId);
            this.timerDurations.delete(sessionId);
        }
    }
}
