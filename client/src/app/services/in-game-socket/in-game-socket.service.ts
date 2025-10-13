import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { InGameEvents } from '@common/constants/in-game-events';
import { InGameSession } from '@common/models/session.interface';

@Injectable({ providedIn: 'root' })
export class InGameSocketService {
    constructor(private readonly socket: SocketService) {}

    playerJoinInGameSession(sessionId: string): void {
        this.socket.emit(InGameEvents.PlayerJoinInGameSession, sessionId);
    }

    onPlayerJoinedInGameSession(callback: (data: InGameSession) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerJoinedInGameSession, callback);
    }

    playerStartGame(sessionId: string): void {
        this.socket.emit(InGameEvents.GameStart, sessionId);
    }

    onGameStarted(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.GameStarted, callback);
    }

    onTurnStarted(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.TurnStarted, callback);
    }

    playerEndTurn(sessionId: string): void {
        this.socket.emit(InGameEvents.TurnEnd, sessionId);
    }

    onTurnEnded(callback: (data: InGameSession) => void): void {
        this.socket.onSuccessEvent(InGameEvents.TurnEnded, callback);
    }

    onTurnTransitionEnded(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.TurnTransitionEnded, callback);
    }

    leaveInGameSession(sessionId: string): void {
        this.socket.emit(InGameEvents.LeaveInGameSession, sessionId);
    }

    onInGameSessionLeft(callback: (data: InGameSession) => void): void {
        this.socket.onSuccessEvent(InGameEvents.InGameSessionLeft, callback);
    }
}
