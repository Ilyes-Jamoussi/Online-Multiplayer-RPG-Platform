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
        session.inGamePlayers[firstPlayer].boatSpeed = session.inGamePlayers[firstPlayer].boatSpeedBonus;

        this.setGameTimerState(session.id, TurnTimerStates.TurnTransition);

        setTimeout(() => {
            try {
                const currentSession = this.sessionRepository.findById(session.id);
                if (!currentSession) return;

                const activePlayer = currentSession.inGamePlayers[newTurn.activePlayerId];
                if (activePlayer) {
                    activePlayer.hasCombatBonus = activePlayer.attackBonus > 0 || activePlayer.defenseBonus > 0;
                }

                this.sessionRepository.updatePlayer(currentSession.id, newTurn.activePlayerId, { actionsRemaining: 1 });
                this.scheduleTurnTimeout(currentSession.id, timeoutMs, () => this.autoEndTurn(currentSession));

                this.eventEmitter.emit(ServerEvents.TurnTransition, { session: currentSession });
                this.eventEmitter.emit(ServerEvents.TurnStarted, { session: currentSession });
                this.setGameTimerState(currentSession.id, TurnTimerStates.PlayerTurn);

                this.triggerVirtualPlayerTurn(currentSession, newTurn.activePlayerId);
            } catch {
                this.clearTimerForSession(session.id);
            }
        }, DEFAULT_TURN_TRANSITION_DURATION);

        return newTurn;
    }

    private nextTurn(session: InGameSession, timeoutMs = DEFAULT_TURN_DURATION): TurnState {
        try {
            const currentSession = this.sessionRepository.findById(session.id);
            if (!currentSession) {
                this.clearTimerForSession(session.id);
                throw new Error('Session not found');
            }

            const prev = currentSession.currentTurn;

            this.clearTurnTimer(currentSession.id);
            currentSession.inGamePlayers[prev.activePlayerId].speed = 0;
            if (currentSession.inGamePlayers[prev.activePlayerId].hasCombatBonus) {
                this.sessionRepository.resetPlayerBonuses(currentSession.id, prev.activePlayerId);
            }
            this.gameCache.decrementDisabledPlaceablesTurnCount(currentSession.id);
            this.eventEmitter.emit(ServerEvents.PlayerReachableTiles, {
                playerId: prev.activePlayerId,
                reachable: [],
            });

            const nextPlayerId = this.getNextPlayer(currentSession, prev.activePlayerId);
            const newTurn: TurnState = {
                turnNumber: prev.turnNumber + 1,
                activePlayerId: nextPlayerId,
                hasUsedAction: false,
            };

            currentSession.currentTurn = newTurn;
            const nextPlayer = currentSession.inGamePlayers[nextPlayerId];
            nextPlayer.speed = nextPlayer.baseSpeed + nextPlayer.speedBonus;
            nextPlayer.boatSpeed = nextPlayer.boatSpeedBonus;
            this.eventEmitter.emit(ServerEvents.TurnEnded, { session: currentSession });
            this.setGameTimerState(currentSession.id, TurnTimerStates.TurnTransition);

            setTimeout(() => {
                try {
                    const sessionInTimeout = this.sessionRepository.findById(currentSession.id);
                    if (!sessionInTimeout) {
                        this.clearTimerForSession(currentSession.id);
                        return;
                    }

                    const activePlayer = sessionInTimeout.inGamePlayers[newTurn.activePlayerId];
                    if (activePlayer) {
                        activePlayer.hasCombatBonus = activePlayer.attackBonus > 0 || activePlayer.defenseBonus > 0;
                    }

                    this.sessionRepository.updatePlayer(sessionInTimeout.id, newTurn.activePlayerId, { actionsRemaining: 1 });
                    this.scheduleTurnTimeout(sessionInTimeout.id, timeoutMs, () => this.autoEndTurn(sessionInTimeout));

                    this.eventEmitter.emit(ServerEvents.TurnTransition, { session: sessionInTimeout });
                    this.eventEmitter.emit(ServerEvents.TurnStarted, { session: sessionInTimeout });
                    this.setGameTimerState(sessionInTimeout.id, TurnTimerStates.PlayerTurn);

                    this.triggerVirtualPlayerTurn(sessionInTimeout, newTurn.activePlayerId);
                } catch {
                    this.clearTimerForSession(currentSession.id);
                }
            }, DEFAULT_TURN_TRANSITION_DURATION);

            return newTurn;
        } catch {
            this.clearTimerForSession(session.id);
            throw new Error('Failed to proceed to next turn');
        }
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
        try {
            const currentSession = this.sessionRepository.findById(session.id);
            if (!currentSession) {
                this.clearTimerForSession(session.id);
                return;
            }
            this.nextTurn(currentSession);
        } catch {
            this.clearTimerForSession(session.id);
        }
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
        if (timerData && timerData?.timeout) clearTimeout(timerData.timeout);
        this.turnTimers.delete(sessionId);
    }

    clearTimerForSession(sessionId: string): void {
        this.forceStopTimer(sessionId);
        this.gameTimerStates.delete(sessionId);
    }

    private triggerVirtualPlayerTurn(session: InGameSession, activePlayerId: string): void {
        try {
            const currentSession = this.sessionRepository.findById(session.id);
            if (!currentSession) return;

            const activePlayer = currentSession.inGamePlayers[activePlayerId];
            if (activePlayer?.virtualPlayerType) {
                this.eventEmitter.emit(ServerEvents.VirtualPlayerTurn, {
                    sessionId: currentSession.id,
                    playerId: activePlayerId,
                    playerType: activePlayer.virtualPlayerType,
                });
            }
        } catch {
            this.clearTimerForSession(session.id);
        }
    }
}
