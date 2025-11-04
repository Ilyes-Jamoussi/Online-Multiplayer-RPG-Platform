import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { InGameService } from '@app/services/in-game/in-game.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { CombatService } from '@app/services/combat/combat.service';

@Component({
    selector: 'app-turn-timer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './turn-timer.component.html',
    styleUrl: './turn-timer.component.scss'
})
export class TurnTimerComponent {
    constructor(
        private readonly inGameService: InGameService,
        private readonly timerCoordinatorService: TimerCoordinatorService,
        private readonly combatService: CombatService,
    ) {}

    get timeRemaining(): Signal<number> {
        return this.inGameService.timeRemaining;
    }

    get isMyTurn(): Signal<boolean> {
        return this.inGameService.isMyTurn;
    }

    get isTransitioning(): Signal<boolean> {
        return this.inGameService.isTransitioning;
    }

    get isGameStarted(): Signal<boolean> {
        return this.inGameService.isGameStarted;
    }

    get isCombatActive(): boolean {
        return this.combatService.isCombatActive();
    }

    get displayedTime(): number {
        if (this.isCombatActive) {
            return this.timerCoordinatorService.getPausedTurnTime();
        }
        return this.timeRemaining();
    }

    get timerLabel(): string {
        if (this.isCombatActive) return 'Combat en cours';
        if (this.isTransitioning()) return 'Transition';
        if (this.isMyTurn()) return 'Votre tour';
        return 'Tour adverse';
    }

    get timerClass(): string {
        if (this.isCombatActive) return 'combat-active';
        if (this.isTransitioning()) return 'transition';
        if (this.isMyTurn()) return 'my-turn';
        return 'other-turn';
    }

    get shouldShowTimer(): boolean {
        const gameStarted = this.isGameStarted();
        const turnActive = this.timerCoordinatorService.isTurnActive() || this.isCombatActive;
        return gameStarted && turnActive;
    }
}
