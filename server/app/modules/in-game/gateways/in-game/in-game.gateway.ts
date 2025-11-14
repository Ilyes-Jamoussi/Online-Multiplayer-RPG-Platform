import { ServerEvents } from '@app/enums/server-events.enum';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { DoorToggledDto } from '@app/modules/in-game/dto/door-toggled.dto';
import { GameOverDto } from '@app/modules/in-game/dto/game-over.dto';
import { PlayerMoveDto } from '@app/modules/in-game/dto/player-move.dto';
import { PlayerMovedDto } from '@app/modules/in-game/dto/player-moved.dto';
import { PlayerTeleportDto } from '@app/modules/in-game/dto/player-teleport.dto';
import { PlayerTeleportedDto } from '@app/modules/in-game/dto/player-teleported.dto';
import { ToggleDoorActionDto } from '@app/modules/in-game/dto/toggle-door-action.dto';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { Player } from '@common/interfaces/player.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UsePipes(
    new ValidationPipe({
        transform: true,
        exceptionFactory: validationExceptionFactory,
    }),
)
@WebSocketGateway({})
@Injectable()
export class InGameGateway {
    @WebSocketServer() private readonly server: Server;

    constructor(private readonly inGameService: InGameService) {}

    @SubscribeMessage(InGameEvents.PlayerJoinInGameSession)
    playerJoinInGameSession(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.joinInGameSession(sessionId, socket.id);
            this.server.to(session.inGameId).emit(InGameEvents.PlayerJoinedInGameSession, successResponse(session));

            if (session.isGameStarted) {
                this.server.to(session.inGameId).emit(InGameEvents.GameStarted, successResponse(session));
            }
        } catch (error) {
            socket.emit(InGameEvents.PlayerJoinedInGameSession, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerEndTurn)
    playerEndTurn(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.endPlayerTurn(sessionId, socket.id);
            this.server.to(session.inGameId).emit(InGameEvents.TurnEnded, successResponse(session));
        } catch (error) {
            socket.emit(InGameEvents.TurnEnded, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerLeaveInGameSession)
    playerLeaveInGameSession(socket: Socket, sessionId: string): void {
        const session = this.inGameService.getSession(sessionId);
        this.playerLeaveSession(sessionId, socket.id);
        this.server.to(socket.id).emit(InGameEvents.LeftInGameSessionAck, successResponse({}));
        void socket.leave(session.inGameId);
    }

    @SubscribeMessage(InGameEvents.ToggleDoorAction)
    toggleDoorAction(socket: Socket, payload: ToggleDoorActionDto): void {
        try {
            this.inGameService.toggleDoorAction(payload.sessionId, socket.id, payload.x, payload.y);
        } catch (error) {
            socket.emit(InGameEvents.ToggleDoorAction, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerMove)
    playerMove(socket: Socket, payload: PlayerMoveDto): void {
        try {
            this.inGameService.movePlayer(payload.sessionId, socket.id, payload.orientation);
        } catch (error) {
            socket.emit(InGameEvents.PlayerMoved, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerSanctuaryRequest)
    playerSanctuaryRequest(socket: Socket, payload: { sessionId: string; x: number; y: number; kind: PlaceableKind }): void {
        try {
            if (payload.kind !== PlaceableKind.HEAL && payload.kind !== PlaceableKind.FIGHT) {
                throw new BadRequestException('Invalid sanctuary kind');
            }
            this.inGameService.sanctuaryRequest(payload.sessionId, socket.id, payload.x, payload.y, payload.kind);
        } catch (error) {
            socket.emit(InGameEvents.PlayerSanctuaryRequest, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerSanctuaryAction)
    playerSanctuaryAction(socket: Socket, payload: { sessionId: string; x: number; y: number; kind: PlaceableKind; double?: boolean }): void {
        try {
            this.inGameService.performSanctuaryAction(payload.sessionId, socket.id, payload.x, payload.y, payload.double);
        } catch (error) {
            socket.emit(InGameEvents.PlayerSanctuaryAction, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerBoardBoat)
    playerBoardBoat(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.inGameService.boardBoat(payload.sessionId, socket.id, payload.x, payload.y);
        } catch (error) {
            socket.emit(InGameEvents.PlayerBoardBoat, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerDisembarkBoat)
    playerDisembarkBoat(socket: Socket, payload: { sessionId: string }): void {
        try {
            this.inGameService.disembarkBoat(payload.sessionId, socket.id);
        } catch (error) {
            socket.emit(InGameEvents.PlayerDisembarkBoat, errorResponse(error.message));
        }
    }

    @OnEvent(ServerEvents.PlaceablePositionUpdated)
    handlePlaceablePositionUpdated(payload: { sessionId: string; placeable: Placeable }): void {
        const session = this.inGameService.getSession(payload.sessionId);
        this.server.to(session.inGameId).emit(InGameEvents.PlaceablePositionUpdated, successResponse(payload.placeable));
    }

    @OnEvent(ServerEvents.OpenSanctuaryDenied)
    handleOpenSanctuaryDenied(payload: { session: InGameSession; playerId: string; message: string }): void {
        const response = errorResponse(payload.message);
        this.server.to(payload.playerId).emit(InGameEvents.OpenSanctuary, response);
    }

    @OnEvent(ServerEvents.OpenSanctuary)
    handleOpenSanctuary(payload: { session: InGameSession; playerId: string; kind: PlaceableKind; x: number; y: number }): void {
        const response = successResponse({ kind: payload.kind, x: payload.x, y: payload.y });
        this.server.to(payload.playerId).emit(InGameEvents.OpenSanctuary, response);
    }

    @OnEvent(ServerEvents.SanctuaryActionFailed)
    handleSanctuaryActionFailed(payload: { session: InGameSession; playerId: string }): void {
        const response = successResponse('Sanctuary action failed');
        this.server.to(payload.playerId).emit(InGameEvents.SanctuaryActionFailed, response);
    }

    @OnEvent(ServerEvents.SanctuaryActionSuccess)
    handleSanctuaryActionSuccess(payload: {
        session: InGameSession;
        playerId: string;
        kind: PlaceableKind;
        x: number;
        y: number;
        addedHealth?: number;
        addedDefense?: number;
        addedAttack?: number;
    }): void {
        const response = successResponse({
            kind: payload.kind,
            x: payload.x,
            y: payload.y,
            success: true,
            addedHealth: payload.addedHealth,
            addedDefense: payload.addedDefense,
            addedAttack: payload.addedAttack,
        });
        this.server.to(payload.playerId).emit(InGameEvents.SanctuaryActionSuccess, response);
    }

    @OnEvent(ServerEvents.PlayerBonusesChanged)
    handlePlayerBonusesChanged(payload: { session: InGameSession; playerId: string; attackBonus: number; defenseBonus: number }) {
        this.server
            .to(payload.playerId)
            .emit(InGameEvents.PlayerBonusesChanged, successResponse({ attackBonus: payload.attackBonus, defenseBonus: payload.defenseBonus }));
    }

    @OnEvent(ServerEvents.TurnStarted)
    handleTurnStarted(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnStarted, successResponse(payload.session));
        this.inGameService.getReachableTiles(payload.session.id, payload.session.currentTurn.activePlayerId);
        this.inGameService.getAvailableActions(payload.session.id, payload.session.currentTurn.activePlayerId);

        // Check if current player is virtual and make them play - commented out for now
        // const currentPlayer = payload.session.inGamePlayers[payload.session.currentTurn.activePlayerId];
        // if (currentPlayer && this.inGameService.isVirtualPlayer(currentPlayer)) {
        //     this.inGameService.playVirtualPlayerTurn(payload.session.id, payload.session.currentTurn.activePlayerId);
        // }
    }

    @OnEvent(ServerEvents.TurnEnded)
    handleTurnEnded(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnEnded, successResponse(payload.session));
    }

    @OnEvent(ServerEvents.TurnTransition)
    handleTurnTransition(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnTransitionEnded, successResponse(payload.session));
    }

    @OnEvent(ServerEvents.TurnTimeout)
    handleTurnTimeout(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnTimeout, successResponse(payload.session));
    }

    @OnEvent(ServerEvents.TurnForcedEnd)
    handleForcedEnd(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnForcedEnd, successResponse(payload.session));
    }

    @OnEvent(ServerEvents.DoorToggled)
    handleDoorToggled(payload: { session: InGameSession; playerId: string; x: number; y: number; isOpen: boolean }) {
        this.server
            .to(payload.session.inGameId)
            .emit(InGameEvents.DoorToggled, successResponse<DoorToggledDto>({ x: payload.x, y: payload.y, isOpen: payload.isOpen }));
        this.server.to(payload.playerId).emit(InGameEvents.PlayerActionUsed, successResponse({}));
    }

    @OnEvent(ServerEvents.PlayerMoved)
    handlePlayerMoved(payload: { session: InGameSession; playerId: string; x: number; y: number; speed: number }) {
        this.server
            .to(payload.session.inGameId)
            .emit(
                InGameEvents.PlayerMoved,
                successResponse<PlayerMovedDto>({ playerId: payload.playerId, x: payload.x, y: payload.y, speed: payload.speed }),
            );
    }

    @OnEvent(ServerEvents.PlayerReachableTiles)
    handlePlayerReachableTiles(payload: { playerId: string; reachable: ReachableTile[] }) {
        this.server.to(payload.playerId).emit(InGameEvents.PlayerReachableTiles, successResponse(payload.reachable));
    }

    @SubscribeMessage(InGameEvents.ToggleAdminMode)
    handleToggleAdminMode(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.toggleAdminMode(sessionId, socket.id);
            this.server.to(session.inGameId).emit(InGameEvents.AdminModeToggled, successResponse({ isAdminModeActive: session.isAdminModeActive }));
        } catch (error) {
            socket.emit(InGameEvents.AdminModeToggled, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.LoadGameStatistics)
    handleLoadGameStatistics(socket: Socket, sessionId: string): void {
        try {
            const gameStatistics = this.inGameService.getGameStatistics(sessionId);
            socket.emit(InGameEvents.LoadGameStatistics, successResponse(gameStatistics));
        } catch {
            socket.emit(InGameEvents.LoadGameStatistics, errorResponse('Impossible de charger les statistiques de la partie'));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerTeleport)
    playerTeleport(socket: Socket, payload: PlayerTeleportDto): void {
        try {
            this.inGameService.teleportPlayer(payload.sessionId, socket.id, payload.x, payload.y);
            const session = this.inGameService.getSession(payload.sessionId);
            const player = session.inGamePlayers[socket.id];
            this.server
                .to(session.inGameId)
                .emit(InGameEvents.PlayerTeleported, successResponse<PlayerTeleportedDto>({ playerId: socket.id, x: player.x, y: player.y }));
            this.inGameService.getReachableTiles(payload.sessionId, socket.id);
        } catch (error) {
            socket.emit(InGameEvents.PlayerTeleported, errorResponse(error.message));
        }
    }

    @OnEvent(ServerEvents.PlayerUpdated)
    handlePlayerUpdated(payload: { sessionId: string; player: Player }) {
        const session = this.inGameService.getSession(payload.sessionId);
        this.server.to(session.inGameId).emit(InGameEvents.PlayerUpdated, successResponse(payload.player));
    }

    @OnEvent(ServerEvents.PlayerAvailableActions)
    handlePlayerAvailableActions(payload: { session: InGameSession; playerId: string; actions: AvailableAction[] }) {
        this.server.to(payload.playerId).emit(InGameEvents.PlayerAvailableActions, successResponse(payload.actions));
    }

    @OnEvent(ServerEvents.GameOver)
    handleGameOver(payload: { sessionId: string; winnerId: string; winnerName: string }) {
        const session = this.inGameService.getSession(payload.sessionId);

        // Stocker les statistiques avant de supprimer la session
        this.inGameService.storeGameStatistics(payload.sessionId, payload.winnerId, payload.winnerName);

        this.server
            .to(session.inGameId)
            .emit(InGameEvents.GameOver, successResponse<GameOverDto>({ winnerId: payload.winnerId, winnerName: payload.winnerName }));

        this.server.socketsLeave(session.inGameId);
        this.server.socketsLeave(session.id);
        this.inGameService.removeSession(session.id);
    }

    handleDisconnect(socket: Socket) {
        const session = this.inGameService.findSessionByPlayerId(socket.id);
        if (session) {
            this.playerLeaveSession(session.id, socket.id);
        }
    }

    private playerLeaveSession(sessionId: string, playerId: string): void {
        try {
            const result = this.inGameService.leaveInGameSession(sessionId, playerId);
            if (result.sessionEnded) {
                // Stocker les statistiques avant de supprimer la session
                this.inGameService.storeGameStatistics(sessionId, '', 'Partie abandonnée');

                this.server.to(result.session.inGameId).emit(InGameEvents.GameForceStopped, successResponse({}));
                this.server.socketsLeave(sessionId);
                this.inGameService.removeSession(sessionId);
            } else {
                if (result.adminModeDeactivated) {
                    this.server.to(result.session.inGameId).emit(InGameEvents.AdminModeToggled, successResponse({ isAdminModeActive: false }));
                }
                this.server.to(result.session.inGameId).emit(InGameEvents.PlayerLeftInGameSession, successResponse(result));
            }
        } catch (error) {
            this.server.to(playerId).emit(InGameEvents.PlayerLeftInGameSession, errorResponse(error.message));
        }
    }

    @OnEvent(ServerEvents.PlayerBoardedBoat)
    handlePlayerBoardedBoat(payload: { session: InGameSession; playerId: string; boatId: string }) {
        this.server
            .to(payload.session.inGameId)
            .emit(InGameEvents.PlayerBoardedBoat, successResponse({ playerId: payload.playerId, boatId: payload.boatId }));
    }

    @OnEvent(ServerEvents.PlayerDisembarkedBoat)
    handlePlayerDisembarkedBoat(payload: { session: InGameSession; playerId: string }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.PlayerDisembarkedBoat, successResponse({ playerId: payload.playerId }));
    }
}
