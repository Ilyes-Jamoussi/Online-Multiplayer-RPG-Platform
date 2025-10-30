import { Injectable, signal } from '@angular/core';
import { TimerService } from '@app/services/timer/timer.service';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';

interface CombatData {
    attackerId: string;
    targetId: string;
    userRole: 'attacker' | 'target';
}

@Injectable({
    providedIn: 'root'
})
export class CombatService {
    private readonly _combatData = signal<CombatData | null>(null);

    readonly combatData = this._combatData.asReadonly();

    constructor(
        private readonly timerService: TimerService,
        private readonly inGameSocketService: InGameSocketService
    ) {}

    get timeRemaining(): number {
        return this.timerService.combatTimeRemaining();
    }

    startCombat(attackerId: string, targetId: string, userRole: 'attacker' | 'target'): void {
        this._combatData.set({ attackerId, targetId, userRole });
        this.timerService.startCombatTimer();
    }

    endCombat(): void {
        this._combatData.set(null);
        this.timerService.stopCombatTimer();
    }

    chooseOffensive(sessionId: string): void {
        this.inGameSocketService.combatChoice(sessionId, 'offensive');
    }

    chooseDefensive(sessionId: string): void {
        this.inGameSocketService.combatChoice(sessionId, 'defensive');
    }
}
