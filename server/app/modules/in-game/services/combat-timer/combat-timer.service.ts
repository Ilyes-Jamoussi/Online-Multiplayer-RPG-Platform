import { COMBAT_DURATION } from '@common/constants/in-game';
import { InGameSession } from '@common/models/session.interface';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CombatTimerService {
    private readonly combatTimers = new Map<string, NodeJS.Timeout>();

    constructor(private readonly eventEmitter: EventEmitter2) {}

    startCombatTimer(session: InGameSession, attackerId: string, targetId: string): void {
        this.eventEmitter.emit('combat.started', {
            session,
            attackerId,
            targetId,
        });
        
        this.scheduleCombatLoop(session);
        this.eventEmitter.emit('combat.timerStarted', { sessionId: session.id });
    }

    stopCombatTimer(session: InGameSession): void {
        const timer = this.combatTimers.get(session.id);
        if (timer) clearTimeout(timer);
        this.combatTimers.delete(session.id);
        
        this.eventEmitter.emit('combat.ended', { session });
        this.eventEmitter.emit('combat.timerStopped', { sessionId: session.id });
    }

    forceNextLoop(session: InGameSession): void {
        this.clearCombatTimer(session);
        this.eventEmitter.emit('combat.newRound', { session });
        this.eventEmitter.emit('combat.timerLoop', { sessionId: session.id });
        this.scheduleCombatLoop(session);
    }

    private scheduleCombatLoop(session: InGameSession): void {
        this.clearCombatTimer(session);
        const timer = setTimeout(() => {
            this.eventEmitter.emit('combat.newRound', { session });
            this.eventEmitter.emit('combat.timerLoop', { sessionId: session.id });
            this.scheduleCombatLoop(session);
        }, COMBAT_DURATION);
        this.combatTimers.set(session.id, timer);
    }

    private clearCombatTimer(session: InGameSession): void {
        const timer = this.combatTimers.get(session.id);
        if (timer) clearTimeout(timer);
        this.combatTimers.delete(session.id);
    }
}

