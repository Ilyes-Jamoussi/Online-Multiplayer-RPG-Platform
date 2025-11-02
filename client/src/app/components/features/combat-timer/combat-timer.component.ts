import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { CombatService } from '@app/services/combat/combat.service';
import { CombatTimerService } from '@app/services/combat-timer/combat-timer.service';

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
        private readonly combatTimerService: CombatTimerService
    ) {}

    get timeRemaining(): Signal<number> {
        return this.combatTimerService.combatTimeRemaining;
    }

    get timerLabel(): string {
        return 'Combat';
    }

    get shouldShowTimer(): boolean {
        return this.combatService.combatData() !== null;
    }
}
