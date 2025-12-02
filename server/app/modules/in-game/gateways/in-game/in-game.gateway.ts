import { ServerEvents } from '@app/enums/server-events.enum';
import { AdminModeToggledDto } from '@app/modules/in-game/dto/admin-mode-toggled.dto';
import { EmptyResponseDto } from '@app/modules/in-game/dto/empty-response.dto';
import { GameOverDto } from '@app/modules/in-game/dto/game-over.dto';
import { GameStatisticsDto } from '@app/modules/in-game/dto/game-statistics.dto';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { NotificationEvents } from '@common/enums/notification-events.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
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

    constructor(
        private readonly inGameService: InGameService,
        private readonly eventEmitter: EventEmitter2,
        private readonly combatService: CombatService,
    ) {}

    @SubscribeMessage(InGameEvents.PlayerJoinInGameSession)
    playerJoinInGameSession(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.joinInGameSession(sessionId, socket.id);
            this.server.to(session.inGameId).emit(InGameEvents.PlayerJoinedInGameSession, successResponse(session));

            if (session.isGameStarted) {
                this.server.to(session.inGameId).emit(InGameEvents.GameStarted, successResponse(session));
            }
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerLeaveInGameSession)
    playerLeaveInGameSession(socket: Socket, sessionId: string): void {
        const session = this.inGameService.getSession(sessionId);
        this.playerLeaveSession(sessionId, socket.id);
        this.server.to(socket.id).emit(InGameEvents.LeftInGameSessionAck, successResponse<EmptyResponseDto>({}));
        void socket.leave(session.inGameId);
    }

    @SubscribeMessage(InGameEvents.PlayerEndTurn)
    playerEndTurn(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.endPlayerTurn(sessionId, socket.id);
            this.server.to(session.inGameId).emit(InGameEvents.TurnEnded, successResponse(session));
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.LoadGameStatistics)
    handleLoadGameStatistics(socket: Socket, sessionId: string): void {
        try {
            const gameStatistics = this.inGameService.getGameStatistics(sessionId);
            socket.emit(InGameEvents.LoadGameStatistics, successResponse<GameStatisticsDto>(gameStatistics));
        } catch {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse('Impossible de charger les statistiques de la partie'));
        }
    }

    @OnEvent(ServerEvents.TurnStarted)
    handleTurnStarted(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnStarted, successResponse(payload.session));
        this.inGameService.getReachableTiles(payload.session.id, payload.session.currentTurn.activePlayerId);
        this.inGameService.getAvailableActions(payload.session.id, payload.session.currentTurn.activePlayerId);
    }

    @OnEvent(ServerEvents.TurnEnded)
    handleTurnEnded(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnEnded, successResponse(payload.session));
    }

    @OnEvent(ServerEvents.TurnTransition)
    handleTurnTransition(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnTransitionEnded, successResponse(payload.session));
    }

    @OnEvent(ServerEvents.SessionUpdated)
    handleSessionUpdated(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.SessionUpdated, successResponse(payload.session));
    }

    @OnEvent(ServerEvents.GameOver)
    handleGameOver(payload: { sessionId: string; winnerId: string; winnerName: string }) {
        const session = this.inGameService.getSession(payload.sessionId);

        // Stocker les statistiques avant de supprimer la session
        this.inGameService.storeGameStatistics(payload.sessionId, payload.winnerId, payload.winnerName);

        this.server
            .to(session.inGameId)
            .emit(InGameEvents.GameOver, successResponse<GameOverDto>({ winnerId: payload.winnerId, winnerName: payload.winnerName }));

        // Faire quitter tous les sockets des rooms
        this.server.socketsLeave(session.inGameId);
        this.server.socketsLeave(session.id);
    }

    handleDisconnect(socket: Socket) {
        const session = this.inGameService.findSessionByPlayerId(socket.id);
        if (session) {
            this.playerLeaveSession(session.id, socket.id);
            this.combatService.combatAbandon(session.id, socket.id);
        }
    }

    private playerLeaveSession(sessionId: string, playerId: string): void {
        try {
            const result = this.inGameService.leaveInGameSession(sessionId, playerId);
            if (result.sessionEnded) {
                // Stocker les statistiques avant de supprimer la session
                this.inGameService.storeGameStatistics(sessionId, '', 'Partie abandonnée');

                this.server.to(result.session.inGameId).emit(InGameEvents.GameForceStopped, successResponse<EmptyResponseDto>({}));
                this.server.socketsLeave(sessionId);
                this.inGameService.removeSession(sessionId);
            } else {
                if (result.adminModeDeactivated) {
                    const adminResponse = successResponse<AdminModeToggledDto>({ isAdminModeActive: false });
                    this.server.to(result.session.inGameId).emit(InGameEvents.AdminModeToggled, adminResponse);
                }
                this.eventEmitter.emit(ServerEvents.PlayerAbandon, {
                    sessionId: result.session.id,
                    playerId: result.playerId,
                    playerName: result.playerName,
                });
                this.server.to(result.session.inGameId).emit(InGameEvents.PlayerLeftInGameSession, successResponse(result));
            }
        } catch (error) {
            this.server.to(playerId).emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }
}
