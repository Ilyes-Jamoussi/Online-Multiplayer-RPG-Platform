import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { InGameEvents } from '@common/constants/in-game-events';
import { Orientation } from '@common/enums/orientation.enum';
import { InGameSession } from '@common/models/session.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';

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

    onGameStarted(callback: (data: InGameSession) => void): void {
        this.socket.onSuccessEvent(InGameEvents.GameStarted, callback);
    }

    onTurnStarted(callback: (data: InGameSession) => void): void {
        this.socket.onSuccessEvent(InGameEvents.TurnStarted, callback);
    }

    onTurnEnded(callback: (data: InGameSession) => void): void {
        this.socket.onSuccessEvent(InGameEvents.TurnEnded, callback);
    }

    onTurnTransitionEnded(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.TurnTransitionEnded, callback);
    }

    playerLeaveInGameSession(sessionId: string): void {
        this.socket.emit(InGameEvents.PlayerLeaveInGameSession, sessionId);
    }

    onPlayerLeftInGameSession(callback: (data: { session: InGameSession; playerName: string }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerLeftInGameSession, callback);
    }

    playerEndTurn(sessionId: string): void {
        this.socket.emit(InGameEvents.PlayerEndTurn, sessionId);
    }

    onTurnTimeout(callback: (data: InGameSession) => void): void {
        this.socket.onSuccessEvent(InGameEvents.TurnTimeout, callback);
    }

    onTurnForcedEnd(callback: (data: InGameSession) => void): void {
        this.socket.onSuccessEvent(InGameEvents.TurnForcedEnd, callback);
    }

    toggleAdminMode(sessionId: string): void {
        this.socket.emit(InGameEvents.ToggleAdminMode, sessionId);
    }

    onAdminModeToggled(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.AdminModeToggled, callback);
    }

    onPlayerMoved(callback: (data: { playerId: string; x: number; y: number; movementPoints: number }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerMoved, callback);
    }

    playerMove(sessionId: string, orientation: Orientation): void {
        this.socket.emit(InGameEvents.PlayerMove, { sessionId, orientation });
    }

    onLeftInGameSessionAck(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.LeftInGameSessionAck, callback);
    }

    onGameForceStopped(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.GameForceStopped, callback);
    }

    onPlayerReachableTiles(callback: (data: ReachableTile[]) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerReachableTiles, callback);
    }
}
