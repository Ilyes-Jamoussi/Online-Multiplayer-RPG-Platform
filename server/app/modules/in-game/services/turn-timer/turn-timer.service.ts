import { ServerEvents } from '@app/enums/server-events.enum';
import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { TurnTimerData } from '@app/interfaces/turn-timer-data.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { InGameSession } from '@common/interfaces/session.interface';
import { TurnState } from '@common/interfaces/turn-state.interface';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TurnTimerService {
    private readonly turnTimers = new Map<string, TurnTimerData>();
    private readonly gameTimerStates = new Map<string, TurnTimerStates>();

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly gameCache: GameCacheService,
    ) {}

    startFirstTurnWithTransition(session: InGameSession, timeoutMs = DEFAULT_TURN_DURATION): TurnState {
        if (!session.turnOrder?.length) throw new Error('TURN_ORDER_NOT_DEFINED');

        const firstPlayer = this.getNextActivePlayer(session, null);
        if (!firstPlayer) throw new Error('NO_ACTIVE_PLAYER');

        const newTurn: TurnState = {
            turnNumber: 1,
            activePlayerId: firstPlayer,
            hasUsedAction: false,
        };

        session.currentTurn = newTurn;
        session.inGamePlayers[firstPlayer].speed = session.inGamePlayers[firstPlayer].baseSpeed + session.inGamePlayers[firstPlayer].speedBonus;

        this.setGameTimerState(session.id, TurnTimerStates.TurnTransition);

        setTimeout(() => {
            const activePlayer = session.inGamePlayers[newTurn.activePlayerId];
            if (activePlayer) {
                activePlayer.hasCombatBonus = activePlayer.attackBonus > 0 || activePlayer.defenseBonus > 0;
            }

            this.sessionRepository.updatePlayer(session.id, newTurn.activePlayerId, { actionsRemaining: 1 });
            this.scheduleTurnTimeout(session.id, timeoutMs, () => this.autoEndTurn(session));

            this.eventEmitter.emit(ServerEvents.TurnTransition, { session });
            this.eventEmitter.emit(ServerEvents.TurnStarted, { session });
            this.setGameTimerState(session.id, TurnTimerStates.PlayerTurn);

            this.triggerVirtualPlayerTurn(session, newTurn.activePlayerId);
        }, DEFAULT_TURN_TRANSITION_DURATION);

        return newTurn;
    }

    private nextTurn(session: InGameSession, timeoutMs = DEFAULT_TURN_DURATION): TurnState {
        const prev = session.currentTurn;

        this.clearTurnTimer(session.id);
        session.inGamePlayers[prev.activePlayerId].speed = 0;
        if (session.inGamePlayers[prev.activePlayerId].hasCombatBonus) {
            this.sessionRepository.resetPlayerBonuses(session.id, prev.activePlayerId);
        }
        this.gameCache.decrementDisabledPlaceablesTurnCount(session.id);
        this.eventEmitter.emit(ServerEvents.PlayerReachableTiles, {
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

        this.eventEmitter.emit(ServerEvents.TurnEnded, { session });
        this.setGameTimerState(session.id, TurnTimerStates.TurnTransition);

        setTimeout(() => {
            const activePlayer = session.inGamePlayers[newTurn.activePlayerId];
            if (activePlayer) {
                activePlayer.hasCombatBonus = activePlayer.attackBonus > 0 || activePlayer.defenseBonus > 0;
            }

            this.sessionRepository.updatePlayer(session.id, newTurn.activePlayerId, { actionsRemaining: 1 });
            this.scheduleTurnTimeout(session.id, timeoutMs, () => this.autoEndTurn(session));

            this.eventEmitter.emit(ServerEvents.TurnTransition, { session });
            this.eventEmitter.emit(ServerEvents.TurnStarted, { session });
            this.setGameTimerState(session.id, TurnTimerStates.PlayerTurn);

            this.triggerVirtualPlayerTurn(session, newTurn.activePlayerId);
        }, DEFAULT_TURN_TRANSITION_DURATION);

        return newTurn;
    }

    endTurnManual(session: InGameSession): void {
        this.clearTurnTimer(session.id);
        this.eventEmitter.emit(ServerEvents.TurnManualEnd, { session });
        this.nextTurn(session);
    }

    getGameTimerState(sessionId: string): TurnTimerStates {
        return this.gameTimerStates.get(sessionId) || TurnTimerStates.PlayerTurn;
    }

    private setGameTimerState(sessionId: string, state: TurnTimerStates): void {
        this.gameTimerStates.set(sessionId, state);
    }

    private autoEndTurn(session: InGameSession): void {
        this.eventEmitter.emit(ServerEvents.TurnTimeout, { session });
        this.nextTurn(session);
    }

    private getNextPlayer(session: InGameSession, currentId: string): string {
        return this.getNextActivePlayer(session, currentId) || session.turnOrder[0];
    }

    private getNextActivePlayer(session: InGameSession, currentId: string | null): string | null {
        const order = session.turnOrder;
        if (!order.length) return null;

        let startIdx = 0;
        if (currentId !== null) {
            const idx = order.indexOf(currentId);
            if (idx === -1) startIdx = 0;
            else startIdx = (idx + 1) % order.length;
        }

        const checkedIds = new Set<string>();
        let attempts = 0;

        while (attempts < order.length) {
            const playerId = order[startIdx];

            if (!checkedIds.has(playerId)) {
                checkedIds.add(playerId);
                const player = session.inGamePlayers[playerId];
                if (player && player.isInGame) {
                    return playerId;
                }
            }

            startIdx = (startIdx + 1) % order.length;
            attempts++;
        }

        return null;
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
    }

    clearTimerForSession(sessionId: string): void {
        this.forceStopTimer(sessionId);
        this.gameTimerStates.delete(sessionId);
    }

    private triggerVirtualPlayerTurn(session: InGameSession, activePlayerId: string): void {
        const activePlayer = session.inGamePlayers[activePlayerId];
        if (activePlayer?.virtualPlayerType) {
            this.eventEmitter.emit(ServerEvents.VirtualPlayerTurn, {
                sessionId: session.id,
                playerId: activePlayerId,
                playerType: activePlayer.virtualPlayerType,
            });
        }
    }
}
