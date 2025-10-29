import { Injectable, signal } from '@angular/core';

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

    startCombat(attackerId: string, targetId: string, userRole: 'attacker' | 'target'): void {
        this._combatData.set({ attackerId, targetId, userRole });
    }

    endCombat(): void {
        this._combatData.set(null);
    }
}
