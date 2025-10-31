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

    onCombatStarted(callback: (data: { attackerId: string; targetId: string }) => void): void {
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
}

