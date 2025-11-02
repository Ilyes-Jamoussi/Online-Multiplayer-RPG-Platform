import { Injectable, signal } from '@angular/core';
import { MILLISECONDS_PER_SECOND } from '@common/constants/in-game';

const COMBAT_ROUND_DURATION = 5;

@Injectable({
    providedIn: 'root',
})
export class CombatTimerService {
    private readonly _combatTimeRemaining = signal<number>(0);
    private readonly _isCombatActive = signal<boolean>(false);

    private combatTimer: number | null = null;

    readonly combatTimeRemaining = this._combatTimeRemaining.asReadonly();
    readonly isCombatActive = this._isCombatActive.asReadonly();

    startCombatTimer(): void {
        if (this.combatTimer) {
            this.resetCombatTimer();
            return;
        }

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

    stopCombatTimer(): void {
        if (this.combatTimer) {
            window.clearInterval(this.combatTimer);
            this.combatTimer = null;
        }
        this._isCombatActive.set(false);
        this._combatTimeRemaining.set(0);
    }

    resetCombatTimer(): void {
        this._combatTimeRemaining.set(COMBAT_ROUND_DURATION);
    }

    resetAllTimers(): void {
        this.stopCombatTimer();
    }
}

