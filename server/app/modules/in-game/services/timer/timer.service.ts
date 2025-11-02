import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { InGameSession } from '@common/models/session.interface';
import { TurnState } from '@common/models/turn-state.interface';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TurnTimerStates } from '@common/enums/turn-timer-states.enum';

interface TurnTimerData {
    timeout: NodeJS.Timeout | null;
    callback: () => void;
    startTime: number;
    duration: number;
    remainingTime: number;
}

@Injectable()
export class TimerService {
    private readonly turnTimers = new Map<string, TurnTimerData>();
    private readonly gameTimerStates = new Map<string, TurnTimerStates>();

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

    endTurnManual(session: InGameSession): void {
        this.clearTurnTimer(session.id);
        this.eventEmitter.emit('turn.manualEnd', { session });
        this.nextTurn(session);
    }


    getGameTimerState(sessionId: string): TurnTimerStates {
        return this.gameTimerStates.get(sessionId) || TurnTimerStates.PlayerTurn;
    }

    setGameTimerState(sessionId: string, state: TurnTimerStates): void {
        this.gameTimerStates.set(sessionId, state);
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
    pauseTurnTimer(sessionId: string): void {
        const timerData = this.turnTimers.get(sessionId);
        if (timerData && timerData.timeout) {
            const elapsed = Date.now() - timerData.startTime;
            timerData.remainingTime = timerData.duration - elapsed;
            clearTimeout(timerData.timeout);
            timerData.timeout = null;
            this.setGameTimerState(sessionId, TurnTimerStates.CombatTurn);
        }
    }

    resumeTurnTimer(sessionId: string): void {
        const timerData = this.turnTimers.get(sessionId);
        if (timerData && !timerData.timeout) {
            timerData.startTime = Date.now();
            timerData.duration = timerData.remainingTime;
            const timer = setTimeout(timerData.callback, timerData.remainingTime);
            timerData.timeout = timer;
            this.setGameTimerState(sessionId, TurnTimerStates.PlayerTurn);
        }
    }

    private scheduleTurnTimeout(sessionId: string, ms: number, callback: () => void): void {
        this.clearTurnTimer(sessionId);
        const timer = setTimeout(callback, ms);
        const timerData: TurnTimerData = {
            timeout: timer,
            callback,
            startTime: Date.now(),
            duration: ms,
            remainingTime: ms,
        };
        this.turnTimers.set(sessionId, timerData);
    }

    private clearTurnTimer(sessionId: string): void {
        const timerData = this.turnTimers.get(sessionId);
        if (timerData?.timeout) clearTimeout(timerData.timeout);
        this.turnTimers.delete(sessionId);
    }

    forceStopTimer(sessionId: string): void {
        const timerData = this.turnTimers.get(sessionId);
        if (timerData?.timeout) clearTimeout(timerData.timeout);
        this.turnTimers.delete(sessionId);
        this.eventEmitter.emit('turn.forceStopTimer', { sessionId });
    }
}
