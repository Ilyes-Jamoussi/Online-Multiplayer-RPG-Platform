import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { InGameEvents } from '@common/constants/in-game-events';
import { Orientation } from '@common/enums/orientation.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { Player } from '@common/models/player.interface';
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

    onPlayerLeftInGameSession(callback: (data: { session: InGameSession; playerName: string; playerId: string }) => void): void {
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

    onPlayerMoved(callback: (data: { playerId: string; x: number; y: number; speed: number }) => void): void {
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

    playerToggleDoorAction(sessionId: string, x: number, y: number): void {
        this.socket.emit(InGameEvents.ToggleDoorAction, { sessionId, x, y });
    }

    onDoorToggled(callback: (data: { x: number; y: number; isOpen: boolean }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.DoorToggled, callback);
    }

    onPlayerUpdated(callback: (data: Player) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerUpdated, callback);
    }

    onPlayerActionUsed(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerActionUsed, callback);
    }

    onPlayerAvailableActions(callback: (data: AvailableAction[]) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerAvailableActions, callback);
    }

    onGameOver(callback: (data: { winnerId: string; winnerName: string }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.GameOver, callback);
    }
}
