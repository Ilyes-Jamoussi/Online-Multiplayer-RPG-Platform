import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { CombatService } from '@app/services/combat/combat.service';
import { TimerService } from '@app/services/timer/timer.service';

@Component({
    selector: 'app-combat-timer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './combat-timer.component.html',
    styleUrl: './combat-timer.component.scss'
})
export class CombatTimerComponent {
    constructor(
        private readonly combatService: CombatService,
        private readonly timerService: TimerService
    ) {}

    get timeRemaining(): Signal<number> {
        return this.timerService.combatTimeRemaining;
    }

    get timerLabel(): string {
        return 'Combat';
    }

    get shouldShowTimer(): boolean {
        return this.combatService.combatData() !== null;
    }
}
