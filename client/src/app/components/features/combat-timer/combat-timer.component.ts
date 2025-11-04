import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { CombatService } from '@app/services/combat/combat.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';

@Component({
    selector: 'app-combat-timer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './combat-timer.component.html',
    styleUrl: './combat-timer.component.scss',
})
export class CombatTimerComponent {
    constructor(
        private readonly combatService: CombatService,
        private readonly timerCoordinatorService: TimerCoordinatorService,
    ) {}

    get timeRemaining(): Signal<number> {
        return this.timerCoordinatorService.combatTimeRemaining;
    }

    get timerLabel(): string {
        return 'Combat';
    }

    get shouldShowTimer(): boolean {
        return this.combatService.combatData() !== null;
    }
}
