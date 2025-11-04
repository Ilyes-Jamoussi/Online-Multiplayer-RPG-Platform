import { COMBAT_DURATION } from '@common/constants/in-game';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CombatTimerService {
    private readonly combatTimers = new Map<string, NodeJS.Timeout>();
    private readonly activeCombats = new Set<string>();

    constructor(private readonly eventEmitter: EventEmitter2) {}

    startCombatTimer(session: InGameSession, attackerId: string, targetId: string, attackerTileEffect?: number, targetTileEffect?: number): void {
        this.activeCombats.add(session.id);

        this.eventEmitter.emit('combat.started', {
            sessionId: session.id,
            attackerId,
            targetId,
            attackerTileEffect,
            targetTileEffect,
        });

        this.scheduleCombatLoop(session);
        this.eventEmitter.emit('combat.timerRestart', { sessionId: session.id });
    }

    stopCombatTimer(session: InGameSession): void {
        this.activeCombats.delete(session.id);
        const timer = this.combatTimers.get(session.id);
        if (timer) {
            clearTimeout(timer);
            this.combatTimers.delete(session.id);
        }
    }

    forceNextLoop(session: InGameSession): void {
        this.clearCombatTimer(session);
        this.eventEmitter.emit('combat.newRound', { sessionId: session.id });
        this.eventEmitter.emit('combat.timerLoop', { sessionId: session.id });
        this.eventEmitter.emit('combat.timerRestart', { sessionId: session.id });
        this.scheduleCombatLoop(session);
    }

    private scheduleCombatLoop(session: InGameSession): void {
        this.clearCombatTimer(session);
        const sessionId = session.id;
        const timer = setTimeout(() => {
            if (this.activeCombats.has(sessionId)) {
                this.eventEmitter.emit('combat.newRound', { sessionId });
                this.eventEmitter.emit('combat.timerLoop', { sessionId });
                this.eventEmitter.emit('combat.timerRestart', { sessionId });
                this.scheduleCombatLoop(session);
            }
        }, COMBAT_DURATION);
        this.combatTimers.set(session.id, timer);
    }

    private clearCombatTimer(session: InGameSession): void {
        const timer = this.combatTimers.get(session.id);
        if (timer) {
            clearTimeout(timer);
            this.combatTimers.delete(session.id);
        }
    }
}
