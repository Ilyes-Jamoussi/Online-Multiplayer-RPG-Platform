import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { InGameEvents } from '@common/constants/in-game-events';
import { CombatResult } from '@common/interfaces/combat.interface';

@Injectable({ providedIn: 'root' })
export class CombatSocketService {
    constructor(private readonly socket: SocketService) {}

    attackPlayerAction(sessionId: string, x: number, y: number): void {
        this.socket.emit(InGameEvents.AttackPlayerAction, { sessionId, x, y });
    }

    combatChoice(sessionId: string, choice: 'offensive' | 'defensive'): void {
        this.socket.emit(InGameEvents.CombatChoice, { sessionId, choice });
    }

    combatAbandon(sessionId: string): void {
        this.socket.emit(InGameEvents.CombatAbandon, { sessionId });
    }

    onCombatStarted(callback: (data: { 
        attackerId: string; 
        targetId: string;
        attackerTileEffect?: number;
        targetTileEffect?: number;
    }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatStarted, callback);
    }

    onCombatEnded(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatEnded, callback);
    }

    onPlayerCombatResult(callback: (data: CombatResult) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerCombatResult, callback);
    }

    onCombatNewRoundStarted(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatNewRoundStarted, callback);
    }

    onPlayerHealthChanged(callback: (data: { playerId: string; newHealth: number }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerHealthChanged, callback);
    }

    onCombatTimerRestart(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatTimerRestart, callback);
    }

    onCombatPostureSelected(callback: (data: { playerId: string; posture: 'offensive' | 'defensive' }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatPostureSelected, callback);
    }

    onCombatVictory(callback: (data: { playerAId: string; playerBId: string; winnerId: string | null; abandon: boolean }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatVictory, callback);
    }

    onCombatCountChanged(callback: (data: { playerId: string; combatCount: number }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatCountChanged, callback);
    }

    onCombatWinsChanged(callback: (data: { playerId: string; combatWins: number }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatWinsChanged, callback);
    }

    onCombatLossesChanged(callback: (data: { playerId: string; combatLosses: number }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatLossesChanged, callback);
    }

    onCombatDrawsChanged(callback: (data: { playerId: string; combatDraws: number }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.CombatDrawsChanged, callback);
    }


}

