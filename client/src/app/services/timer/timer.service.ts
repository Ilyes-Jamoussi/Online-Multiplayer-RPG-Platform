import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MILLISECONDS_PER_SECOND } from '@common/constants/in-game';
import { COMBAT_ROUND_DURATION_SECONDS } from '@app/constants/combat.constants';
import { ROUTES } from '@app/enums/routes.enum';
import { GAME_OVER_REDIRECT_DELAY_MS } from '@app/constants/game.constants';

@Injectable({
    providedIn: 'root',
})
export class TimerService {
    private readonly _turnTimeRemaining = signal<number>(0);
    private readonly _isTurnActive = signal<boolean>(false);
    private readonly _combatTimeRemaining = signal<number>(0);
    private readonly _isCombatActive = signal<boolean>(false);
    private readonly _gameOverTimeRemaining = signal<number>(0);
    private readonly _isGameOverActive = signal<boolean>(false);

    private turnTimer: number | null = null;
    private pausedTurnTime: number = 0;
    private combatTimer: number | null = null;
    private gameOverTimer: number | null = null;

    readonly turnTimeRemaining = this._turnTimeRemaining.asReadonly();
    readonly isTurnActive = this._isTurnActive.asReadonly();
    readonly combatTimeRemaining = this._combatTimeRemaining.asReadonly();
    readonly isCombatActive = this._isCombatActive.asReadonly();
    readonly gameOverTimeRemaining = this._gameOverTimeRemaining.asReadonly();
    readonly isGameOverActive = this._isGameOverActive.asReadonly();

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
            this.pausedTurnTime = this._turnTimeRemaining() - 1;
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

    startCombatTimer(): void {
        if (this.combatTimer) {
            this.resetCombatTimer();
            return;
        }

        this._combatTimeRemaining.set(COMBAT_ROUND_DURATION_SECONDS);
        this._isCombatActive.set(true);

        this.combatTimer = window.setInterval(() => {
            const currentTime = this._combatTimeRemaining();
            if (currentTime <= 1) {
                this._combatTimeRemaining.set(COMBAT_ROUND_DURATION_SECONDS);
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
        this._combatTimeRemaining.set(COMBAT_ROUND_DURATION_SECONDS);
    }

    startGameOverTimer(router: Router): void {
        this.stopGameOverTimer();
        const gameOverDurationSeconds = GAME_OVER_REDIRECT_DELAY_MS / MILLISECONDS_PER_SECOND;

        this._gameOverTimeRemaining.set(gameOverDurationSeconds);
        this._isGameOverActive.set(true);

        this.gameOverTimer = window.setInterval(() => {
            const currentTime = this._gameOverTimeRemaining();
            if (currentTime <= 1) {
                this.stopGameOverTimer();
                void router.navigate([ROUTES.HomePage]);
            } else {
                this._gameOverTimeRemaining.set(currentTime - 1);
            }
        }, MILLISECONDS_PER_SECOND);
    }

    stopGameOverTimer(): void {
        if (this.gameOverTimer) {
            window.clearInterval(this.gameOverTimer);
            this.gameOverTimer = null;
        }
        this._isGameOverActive.set(false);
        this._gameOverTimeRemaining.set(0);
    }

    resetAllTimers(): void {
        this.stopTurnTimer();
        this.stopCombatTimer();
        this.stopGameOverTimer();
    }
}
