import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION, COMBAT_DURATION } from '@common/constants/in-game';
import { InGameSession } from '@common/models/session.interface';
import { TurnState } from '@common/models/turn-state.interface';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TurnTimerStates } from '@common/enums/turn-timer-states.enum';


@Injectable()
export class TimerService {
    private readonly turnTimers = new Map<string, NodeJS.Timeout>();
    private readonly combatTimers = new Map<string, NodeJS.Timeout>();
    private readonly gameTimerStates = new Map<string, TurnTimerStates >();

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly sessionRepository: InGameSessionRepository,
    ) {}

    startFirstTurn(session: InGameSession, timeoutMs = DEFAULT_TURN_DURATION): TurnState {
        if (!session.turnOrder?.length) throw new Error('TURN_ORDER_NOT_DEFINED');

        const firstPlayer = session.turnOrder[0];
        session.inGamePlayers[firstPlayer].speed = session.inGamePlayers[firstPlayer].speed;
        const newTurn: TurnState = {
            turnNumber: 1,
            activePlayerId: firstPlayer,
            hasUsedAction: false,
        };

        session.currentTurn = newTurn;
        this.scheduleTurnTimeout(session.id, timeoutMs, () => this.autoEndTurn(session));

        this.eventEmitter.emit('turn.started', { session });

        this.setGameTimerState(session.id, TurnTimerStates.PlayerTurn);

        return newTurn;
    }

    nextTurn(session: InGameSession, timeoutMs = DEFAULT_TURN_DURATION): TurnState {
        const prev = session.currentTurn;

        this.clearTurnTimer(session.id);
        session.inGamePlayers[prev.activePlayerId].speed = 0;
        this.eventEmitter.emit('player.reachableTiles', {
            playerId: prev.activePlayerId,
            reachable: [],
        });

        const nextPlayerId = this.getNextPlayer(session, prev.activePlayerId);
        const newTurn: TurnState = {
            turnNumber: prev.turnNumber + 1,
            activePlayerId: nextPlayerId,
            hasUsedAction: false,
        };

        session.currentTurn = newTurn;
        session.inGamePlayers[nextPlayerId].speed = session.inGamePlayers[nextPlayerId].baseSpeed + session.inGamePlayers[nextPlayerId].speedBonus;
        
        this.eventEmitter.emit('turn.ended', { session });
        this.setGameTimerState(session.id, TurnTimerStates.TurnTransition);

        setTimeout(() => {
            this.sessionRepository.updatePlayer(session.id, newTurn.activePlayerId, { actionsRemaining: 1 });
            this.scheduleTurnTimeout(session.id, timeoutMs, () => this.autoEndTurn(session));

            this.eventEmitter.emit('turn.transition', { session });
            this.eventEmitter.emit('turn.started', { session });
            this.setGameTimerState(session.id, TurnTimerStates.PlayerTurn);
        }, DEFAULT_TURN_TRANSITION_DURATION);

        return newTurn;
    }

    endTurnManual(session: InGameSession): TurnState {
        this.clearTurnTimer(session.id);
        this.eventEmitter.emit('turn.manualEnd', { session });
        return this.nextTurn(session);
    }

    getGameTimerState(sessionId: string): TurnTimerStates {
        return this.gameTimerStates.get(sessionId) || TurnTimerStates.PlayerTurn;
    }

    private autoEndTurn(session: InGameSession): void {
        this.eventEmitter.emit('turn.timeout', { session });
        this.nextTurn(session);
    }

    private getNextPlayer(session: InGameSession, currentId: string): string {
        const order = session.turnOrder;
        const idx = order.indexOf(currentId);
        if (idx === -1) return order[0];
        return order[(idx + 1) % order.length];
    }
    private scheduleTurnTimeout(sessionId: string, ms: number, callback: () => void): void {
        this.clearTurnTimer(sessionId);
        const timer = setTimeout(callback, ms);
        this.turnTimers.set(sessionId, timer);
    }

    private clearTurnTimer(sessionId: string): void {
        const timer = this.turnTimers.get(sessionId);
        if (timer) clearTimeout(timer);
        this.turnTimers.delete(sessionId);
    }

    private setGameTimerState(sessionId: string, state: TurnTimerStates): void {
        this.gameTimerStates.set(sessionId, state);
    }

    forceEndTurn(session: InGameSession): void {
        this.clearTurnTimer(session.id);
        this.eventEmitter.emit('turn.forcedEnd', { session });
        this.nextTurn(session);
    }

    forceStopTimer(sessionId: string): void {
        const timer = this.turnTimers.get(sessionId);
        if (timer) clearTimeout(timer);
        this.turnTimers.delete(sessionId);
        this.eventEmitter.emit('turn.forceStopTimer', { sessionId });
    }

    // === COMBAT TIMER METHODS ===
    startCombatTimer(sessionId: string): void {
        this.pauseTurnTimer(sessionId);
        this.scheduleCombatLoop(sessionId);
        this.eventEmitter.emit('combat.timerStarted', { sessionId });
    }

    stopCombatTimer(sessionId: string): void {
        const timer = this.combatTimers.get(sessionId);
        if (timer) clearTimeout(timer);
        this.combatTimers.delete(sessionId);
        this.resumeTurnTimer(sessionId);
        this.eventEmitter.emit('combat.timerStopped', { sessionId });
    }

    private scheduleCombatLoop(sessionId: string): void {
        this.clearCombatTimer(sessionId);
        const timer = setTimeout(() => {
            this.eventEmitter.emit('combat.timerLoop', { sessionId });
            this.scheduleCombatLoop(sessionId);
        }, COMBAT_DURATION);
        this.combatTimers.set(sessionId, timer);
    }

    private clearCombatTimer(sessionId: string): void {
        const timer = this.combatTimers.get(sessionId);
        if (timer) clearTimeout(timer);
        this.combatTimers.delete(sessionId);
    }

    private pauseTurnTimer(sessionId: string): void {
        const timer = this.turnTimers.get(sessionId);
        if (timer) {
            clearTimeout(timer);
            this.turnTimers.delete(sessionId);
            this.eventEmitter.emit('turn.paused', { sessionId });
        }
    }

    private resumeTurnTimer(sessionId: string): void {
        this.eventEmitter.emit('turn.resumed', { sessionId });
    }
}
