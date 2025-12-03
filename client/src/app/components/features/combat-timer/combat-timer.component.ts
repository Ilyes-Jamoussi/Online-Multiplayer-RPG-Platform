import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { COMBAT_TIMER_MAX_SECONDS } from '@app/constants/timer.constants';
import { CombatService } from '@app/services/combat/combat.service';
import { TimerService } from '@app/services/timer/timer.service';

@Component({
    selector: 'app-combat-timer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './combat-timer.component.html',
    styleUrl: './combat-timer.component.scss',
})
export class CombatTimerComponent {
    readonly combatTimerMaxSeconds = COMBAT_TIMER_MAX_SECONDS;

    constructor(
        private readonly combatService: CombatService,
        private readonly timerCoordinatorService: TimerService,
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
