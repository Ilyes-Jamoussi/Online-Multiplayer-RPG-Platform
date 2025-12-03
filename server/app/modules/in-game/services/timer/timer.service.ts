import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { TurnTimerService } from '@app/modules/in-game/services/turn-timer/turn-timer.service';
import { CombatTimerService } from '@app/modules/in-game/services/combat-timer/combat-timer.service';
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { InGameSession } from '@common/interfaces/session.interface';
import { TurnState } from '@common/interfaces/turn-state.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TimerService {
    constructor(
        private readonly turnTimerService: TurnTimerService,
        private readonly combatTimerService: CombatTimerService,
    ) {}

    // Turn timer delegation
    startFirstTurnWithTransition(session: InGameSession, timeoutMs = DEFAULT_TURN_DURATION): TurnState {
        return this.turnTimerService.startFirstTurnWithTransition(session, timeoutMs);
    }

    endTurnManual(session: InGameSession): void {
        this.turnTimerService.endTurnManual(session);
    }

    getGameTimerState(sessionId: string): TurnTimerStates {
        return this.turnTimerService.getGameTimerState(sessionId);
    }

    forceStopTimer(sessionId: string): void {
        this.turnTimerService.forceStopTimer(sessionId);
    }

    clearTimerForSession(sessionId: string): void {
        this.turnTimerService.clearTimerForSession(sessionId);
        this.combatTimerService.stopCombatTimer({ id: sessionId } as InGameSession);
    }

    startCombatTimer(session: InGameSession, attackerId: string, targetId: string, attackerTileEffect?: number, targetTileEffect?: number): void {
        this.combatTimerService.startCombatTimer(session, attackerId, targetId, attackerTileEffect, targetTileEffect);
    }

    stopCombatTimer(session: InGameSession): void {
        this.combatTimerService.stopCombatTimer(session);
    }

    forceNextLoop(session: InGameSession): void {
        this.combatTimerService.forceNextLoop(session);
    }

    startCombat(session: InGameSession, attackerId: string, targetId: string, attackerTileEffect?: number, targetTileEffect?: number): void {
        this.turnTimerService.pauseTurnTimer(session.id);
        this.combatTimerService.startCombatTimer(session, attackerId, targetId, attackerTileEffect, targetTileEffect);
    }

    endCombat(session: InGameSession, winnerId: string | null): void {
        this.combatTimerService.stopCombatTimer(session);
        if (!winnerId || winnerId !== session.currentTurn.activePlayerId) {
            this.turnTimerService.endTurnManual(session);
        } else {
            this.turnTimerService.resumeTurnTimer(session.id);
        }
    }
}
