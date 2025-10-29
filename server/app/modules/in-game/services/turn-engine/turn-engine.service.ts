import { Injectable } from '@nestjs/common';
import { InGameSession } from '@common/models/session.interface';
import { TurnState } from '@common/models/turn-state.interface';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TurnEngineService {
    private readonly timers = new Map<string, NodeJS.Timeout>();

    constructor(private readonly eventEmitter: EventEmitter2) {}

    startFirstTurn(session: InGameSession, timeoutMs = DEFAULT_TURN_DURATION): TurnState {
        if (!session.turnOrder?.length) throw new Error('TURN_ORDER_NOT_DEFINED');

        const firstPlayer = session.turnOrder[0];
        session.inGamePlayers[firstPlayer].movementPoints = session.inGamePlayers[firstPlayer].speed;
        const newTurn: TurnState = {
            turnNumber: 1,
            activePlayerId: firstPlayer,
            hasUsedAction: false,
        };

        session.currentTurn = newTurn;
        this.scheduleTurnTimeout(session.id, timeoutMs, () => this.autoEndTurn(session));

        this.eventEmitter.emit('turn.started', { session });

        return newTurn;
    }

    nextTurn(session: InGameSession, timeoutMs = DEFAULT_TURN_DURATION): TurnState {
        const prev = session.currentTurn;
        session.inGamePlayers[prev.activePlayerId].movementPoints = 0;
        const nextPlayer = this.getNextPlayer(session, prev.activePlayerId);

        const newTurn: TurnState = {
            turnNumber: prev.turnNumber + 1,
            activePlayerId: nextPlayer,
            hasUsedAction: false,
        };

        session.currentTurn = newTurn;
        session.inGamePlayers[nextPlayer].movementPoints = session.inGamePlayers[nextPlayer].speed;

        this.clearTimer(session.id);
        this.eventEmitter.emit('turn.ended', { session });

        setTimeout(() => {
            this.scheduleTurnTimeout(session.id, timeoutMs, () => this.autoEndTurn(session));

            this.eventEmitter.emit('turn.transition', { session });
            this.eventEmitter.emit('turn.started', { session });
        }, DEFAULT_TURN_TRANSITION_DURATION);

        return newTurn;
    }

    endTurnManual(session: InGameSession): TurnState {
        this.clearTimer(session.id);
        this.eventEmitter.emit('turn.manualEnd', { session });
        return this.nextTurn(session);
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
        this.clearTimer(sessionId);
        const timer = setTimeout(callback, ms);
        this.timers.set(sessionId, timer);
    }

    private clearTimer(sessionId: string): void {
        const timer = this.timers.get(sessionId);
        if (timer) clearTimeout(timer);
        this.timers.delete(sessionId);
    }

    forceEndTurn(session: InGameSession): void {
        this.clearTimer(session.id);
        this.eventEmitter.emit('turn.forcedEnd', { session });
        this.nextTurn(session);
    }

    forceStopTimer(sessionId: string): void {
        const timer = this.timers.get(sessionId);
        if (timer) clearTimeout(timer);
        this.timers.delete(sessionId);
        this.eventEmitter.emit('turn.forceStopTimer', { sessionId });
    }
}
