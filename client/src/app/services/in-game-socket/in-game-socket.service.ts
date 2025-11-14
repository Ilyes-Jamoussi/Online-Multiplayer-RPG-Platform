import { Injectable } from '@angular/core';
import { AdminModeToggledDto } from '@app/dto/admin-mode-toggled-dto';
import { DoorToggledDto } from '@app/dto/door-toggled-dto';
import { GameOverDto } from '@app/dto/game-over-dto';
import { GameStatisticsDto } from '@app/dto/game-statistics-dto';
import { PlayerLeftSessionDto } from '@app/dto/player-left-session-dto';
import { PlayerMoveDto } from '@app/dto/player-move-dto';
import { PlayerMovedDto } from '@app/dto/player-moved-dto';
import { PlayerTeleportDto } from '@app/dto/player-teleport-dto';
import { PlayerTeleportedDto } from '@app/dto/player-teleported-dto';
import { ToggleDoorActionDto } from '@app/dto/toggle-door-action-dto';
import { SocketService } from '@app/services/socket/socket.service';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { Player } from '@common/interfaces/player.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';

@Injectable({ providedIn: 'root' })
export class InGameSocketService {
    constructor(private readonly socket: SocketService) {}

    playerJoinInGameSession(sessionId: string): void {
        this.socket.emit(InGameEvents.PlayerJoinInGameSession, sessionId);
    }

    playerLeaveInGameSession(sessionId: string): void {
        this.socket.emit(InGameEvents.PlayerLeaveInGameSession, sessionId);
    }

    playerEndTurn(sessionId: string): void {
        this.socket.emit(InGameEvents.PlayerEndTurn, sessionId);
    }

    playerMove(data: PlayerMoveDto): void {
        this.socket.emit(InGameEvents.PlayerMove, data);
    }

    playerTeleport(data: PlayerTeleportDto): void {
        this.socket.emit(InGameEvents.PlayerTeleport, data);
    }

    playerToggleDoorAction(data: ToggleDoorActionDto): void {
        this.socket.emit(InGameEvents.ToggleDoorAction, data);
    }

    playerSanctuaryRequest(data: { sessionId: string; x: number; y: number; kind: PlaceableKind }): void {
        this.socket.emit(InGameEvents.PlayerSanctuaryRequest, data);
    }

    playerSanctuaryAction(data: { sessionId: string; x: number; y: number; kind: PlaceableKind; double?: boolean }): void {
        this.socket.emit(InGameEvents.PlayerSanctuaryAction, data);
    }

    toggleAdminMode(sessionId: string): void {
        this.socket.emit(InGameEvents.ToggleAdminMode, sessionId);
    }

    loadGameStatistics(sessionId: string): void {
        this.socket.emit(InGameEvents.LoadGameStatistics, sessionId);
    }

    onAdminModeToggled(callback: (data: AdminModeToggledDto) => void): void {
        this.socket.onSuccessEvent(InGameEvents.AdminModeToggled, callback);
    }

    onPlayerMoved(callback: (data: PlayerMovedDto) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerMoved, callback);
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

    onPlayerTeleported(callback: (data: PlayerTeleportedDto) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerTeleported, callback);
    }

    onDoorToggled(callback: (data: DoorToggledDto) => void): void {
        this.socket.onSuccessEvent(InGameEvents.DoorToggled, callback);
    }

    onOpenSanctuary(callback: (data: { kind: PlaceableKind.HEAL | PlaceableKind.FIGHT; x: number; y: number }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.OpenSanctuary, callback);
    }

    onOpenSanctuaryError(callback: (message: string) => void): void {
        this.socket.onErrorEvent(InGameEvents.OpenSanctuary, callback);
    }

    onSanctuaryActionFailed(callback: () => void): void {
        this.socket.onSuccessEvent(InGameEvents.SanctuaryActionFailed, callback);
    }

    onSanctuaryActionSuccess(
        callback: (data: {
            kind: PlaceableKind.HEAL | PlaceableKind.FIGHT;
            x: number;
            y: number;
            success: boolean;
            addedHealth?: number;
            addedDefense?: number;
            addedAttack?: number;
        }) => void,
    ): void {
        this.socket.onSuccessEvent(InGameEvents.SanctuaryActionSuccess, callback);
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

    onGameOver(callback: (data: GameOverDto) => void): void {
        this.socket.onSuccessEvent(InGameEvents.GameOver, callback);
    }

    onPlayerJoinedInGameSession(callback: (data: InGameSession) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerJoinedInGameSession, callback);
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

    onPlayerLeftInGameSession(callback: (data: PlayerLeftSessionDto) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerLeftInGameSession, callback);
    }

    onPlayerBonusesChanged(callback: (data: { attackBonus: number; defenseBonus: number }) => void): void {
        this.socket.onSuccessEvent(InGameEvents.PlayerBonusesChanged, callback);
    }

    onLoadGameStatistics(callback: (data: GameStatisticsDto) => void): void {
        this.socket.onSuccessEvent(InGameEvents.LoadGameStatistics, callback);
    }

    onLoadGameStatisticsError(callback: (message: string) => void): void {
        this.socket.onErrorEvent(InGameEvents.LoadGameStatistics, callback);
    }
}
