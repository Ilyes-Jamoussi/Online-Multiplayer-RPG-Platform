import { Injectable } from '@nestjs/common';
import { TurnTimerService } from './turn-timer.service';
import { InGameSessionService } from './in-game-session.service';
import { InGameSession } from '@common/models/session.interface';

export enum TurnState {
    WaitingForPlayers = 'WAITING_FOR_PLAYERS',
    TurnActive = 'TURN_ACTIVE',
    TurnTransition = 'TURN_TRANSITION',
    GameOver = 'GAME_OVER',
}

export interface TurnCallbacks {
    endTurnCallback?: (updatedSession: InGameSession) => void;
    transitionCallback?: () => void;
    gameOverCallback?: (session: InGameSession) => void;
}

const DEFAULT_TURN_DURATION = 30;
const DEFAULT_TURN_TRANSITION_DURATION = 3;

@Injectable()
export class TurnStateMachineService {
    private readonly states = new Map<string, TurnState>();

    constructor(
        private readonly timer: TurnTimerService,
        private readonly sessionService: InGameSessionService,
    ) {}

    startFirstTurn(sessionId: string, callbacks: TurnCallbacks): void {
        const session = this.sessionService.get(sessionId);
        if (!session) throw new Error('Session not found');

        const activePlayer = this.sessionService.getCurrentPlayer(sessionId);
        if (!activePlayer) throw new Error('No active player to start');

        this.states.set(sessionId, TurnState.TurnActive);
        this.startTurnTimer(sessionId, activePlayer.id, callbacks);
    }

    playerEndTurn(sessionId: string, playerId: string, callbacks: TurnCallbacks): void {
        const state = this.states.get(sessionId);
        if (state !== TurnState.TurnActive) return;

        const session = this.sessionService.get(sessionId);
        if (!session) throw new Error('Session not found');
        const activePlayer = this.sessionService.getCurrentPlayer(sessionId);
        if (activePlayer?.id !== playerId) throw new Error('Player is not active');

        this.timer.clearTurnTimer(sessionId);
        this.endTurn(sessionId, callbacks);
    }

    forceEndTurn(sessionId: string, callbacks: TurnCallbacks): void {
        const state = this.states.get(sessionId);
        if (state !== TurnState.TurnActive) return;
        this.endTurn(sessionId, callbacks);
    }

    private endTurn(sessionId: string, callbacks: TurnCallbacks): void {
        const updatedSession = this.sessionService.advanceToNextPlayer(sessionId);
        this.states.set(sessionId, TurnState.TurnTransition);

        callbacks.endTurnCallback?.(updatedSession);

        this.timer.startTurnTimer(sessionId, DEFAULT_TURN_TRANSITION_DURATION, () => this.startNextTurn(sessionId, callbacks));
    }

    private startNextTurn(sessionId: string, callbacks: TurnCallbacks): void {
        const session = this.sessionService.get(sessionId);
        if (!session) return;

        if (this.checkGameOver(session)) {
            this.states.set(sessionId, TurnState.GameOver);
            callbacks.gameOverCallback?.(session);
            return;
        }

        const activePlayer = this.sessionService.getCurrentPlayer(sessionId);
        if (!activePlayer) return;

        this.states.set(sessionId, TurnState.TurnActive);
        callbacks.transitionCallback?.();
        this.startTurnTimer(sessionId, activePlayer.id, callbacks);
    }

    private startTurnTimer(sessionId: string, playerId: string, callbacks: TurnCallbacks): void {
        this.timer.startTurnTimer(sessionId, DEFAULT_TURN_DURATION, () => {
            this.forceEndTurn(sessionId, callbacks);
        });
    }

    private checkGameOver(session: InGameSession): boolean {
        // TODO
        // this implementation is not correct and is a placeholder
        const alivePlayers = session.players.filter((p) => p.joinedInGameSession);
        return alivePlayers.length <= 1;
    }

    getState(sessionId: string): TurnState | undefined {
        return this.states.get(sessionId);
    }
}
