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
    /** Quand un tour se termine (maj de session envoyée au client) */
    endTurnCallback?: (updatedSession: InGameSession) => void;
    /** Quand on passe à l’état suivant (par ex. après 3 secondes de transition) */
    transitionCallback?: () => void;
    /** Quand le jeu se termine (condition de victoire, etc.) */
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

    /** Initialise le cycle de tours */
    startFirstTurn(sessionId: string, callbacks: TurnCallbacks): void {
        const session = this.sessionService.get(sessionId);
        if (!session) throw new Error('Session not found');

        const activePlayer = this.sessionService.getCurrentPlayer(sessionId);
        if (!activePlayer) throw new Error('No active player to start');

        this.states.set(sessionId, TurnState.TurnActive);
        this.startTurnTimer(sessionId, activePlayer.id, callbacks);
    }

    /** Le joueur actif termine volontairement son tour */
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

    /** Forcé (timeout du timer) */
    forceEndTurn(sessionId: string, callbacks: TurnCallbacks): void {
        const state = this.states.get(sessionId);
        if (state !== TurnState.TurnActive) return;
        this.endTurn(sessionId, callbacks);
    }

    /** Fin du tour → transition */
    private endTurn(sessionId: string, callbacks: TurnCallbacks): void {
        const updatedSession = this.sessionService.advanceToNextPlayer(sessionId);
        this.states.set(sessionId, TurnState.TurnTransition);

        callbacks.endTurnCallback?.(updatedSession);

        // Lancer la phase de transition (3s par défaut)
        this.timer.startTurnTimer(sessionId, DEFAULT_TURN_TRANSITION_DURATION, () => this.startNextTurn(sessionId, callbacks));
    }

    /** Début d’un nouveau tour après transition */
    private startNextTurn(sessionId: string, callbacks: TurnCallbacks): void {
        const session = this.sessionService.get(sessionId);
        if (!session) return;

        // Vérifie condition de fin (optionnel, extensible)
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

    /** Timer de tour principal */
    private startTurnTimer(sessionId: string, playerId: string, callbacks: TurnCallbacks): void {
        this.timer.startTurnTimer(sessionId, DEFAULT_TURN_DURATION, () => {
            this.forceEndTurn(sessionId, callbacks);
        });
    }

    /** Vérifie conditions de fin de partie (placeholder extensible) */
    private checkGameOver(session: InGameSession): boolean {
        // Exemple : si plus d’un joueur actif
        const alivePlayers = session.players.filter((p) => p.joinedInGameSession);
        return alivePlayers.length <= 1;
    }

    /** Permet de récupérer l’état courant (utile pour debug ou logs) */
    getState(sessionId: string): TurnState | undefined {
        return this.states.get(sessionId);
    }
}
