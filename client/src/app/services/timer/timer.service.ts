import { Injectable, signal } from '@angular/core';
import { MILLISECONDS_PER_SECOND } from '@common/constants/in-game';

const COMBAT_ROUND_DURATION = 5;

@Injectable({
    providedIn: 'root',
})
export class TimerService {
    private readonly _turnTimeRemaining = signal<number>(0);
    private readonly _combatTimeRemaining = signal<number>(0);
    private readonly _isTurnActive = signal<boolean>(false);
    private readonly _isCombatActive = signal<boolean>(false);
    
    private turnTimer: number | null = null;
    private combatTimer: number | null = null;
    private pausedTurnTime: number = 0;

    readonly turnTimeRemaining = this._turnTimeRemaining.asReadonly();
    readonly combatTimeRemaining = this._combatTimeRemaining.asReadonly();
    readonly isTurnActive = this._isTurnActive.asReadonly();
    readonly isCombatActive = this._isCombatActive.asReadonly();

    getPausedTurnTime(): number {
        return this.pausedTurnTime;
    }

    startTurnTimer(duration: number): void {
        this.stopTurnTimer();
        this._turnTimeRemaining.set(duration / MILLISECONDS_PER_SECOND);
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

    startCombatTimer(): void {
        this.pausedTurnTime = this._turnTimeRemaining();
        this.stopTurnTimer();
        
        this._combatTimeRemaining.set(COMBAT_ROUND_DURATION);
        this._isCombatActive.set(true);

        this.combatTimer = window.setInterval(() => {
            const currentTime = this._combatTimeRemaining();
            if (currentTime <= 1) {
                this._combatTimeRemaining.set(COMBAT_ROUND_DURATION);
            } else {
                this._combatTimeRemaining.set(currentTime - 1);
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
    }

    stopCombatTimer(): void {
        if (this.combatTimer) {
            window.clearInterval(this.combatTimer);
            this.combatTimer = null;
        }
        this._isCombatActive.set(false);
        this._combatTimeRemaining.set(0);
        
        this.resumeTurnTimer();
    }

    resetCombatTimer(): void {
        this._combatTimeRemaining.set(COMBAT_ROUND_DURATION);
    }

    private resumeTurnTimer(): void {
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
        this.stopCombatTimer();
        this.pausedTurnTime = 0;
    }
}

