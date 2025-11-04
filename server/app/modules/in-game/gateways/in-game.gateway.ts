import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { InGameEvents } from '@common/constants/in-game-events';
import { Orientation } from '@common/enums/orientation.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { Player } from '@common/models/player.interface';
import { InGameSession } from '@common/models/session.interface';
import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@UsePipes(
    new ValidationPipe({
        transform: true,
        exceptionFactory: (errors): Error => {
            new Logger('ValidationPipe').error('Validation failed:', errors);
            throw new Error('Validation failed');
        },
    }),
)
@WebSocketGateway({})
@Injectable()
export class InGameGateway {
    @WebSocketServer() private readonly server: Server;
    private readonly logger = new Logger(InGameGateway.name);

    constructor(private readonly inGameService: InGameService) {}

    @SubscribeMessage(InGameEvents.PlayerJoinInGameSession)
    playerJoinInGameSession(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.joinInGameSession(sessionId, socket.id);
            this.server.to(session.inGameId).emit(InGameEvents.PlayerJoinedInGameSession, successResponse(session));
            this.logger.log(`Player ${socket.id} joined session ${session.id}`);
        } catch (error) {
            this.logger.error(`Error joining session ${sessionId} for player ${socket.id}: ${error.message}`);
            socket.emit(InGameEvents.PlayerJoinedInGameSession, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.GameStart)
    startGame(socket: Socket, sessionId: string): void {
        try {
            const started = this.inGameService.startSession(sessionId);
            this.server.to(started.inGameId).emit(InGameEvents.GameStarted, successResponse(started));
            this.logger.log(`Game started for session ${started.inGameId}`);
        } catch (error) {
            socket.emit(InGameEvents.GameStarted, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerEndTurn)
    playerEndTurn(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.endPlayerTurn(sessionId, socket.id);
            this.server.to(session.inGameId).emit(InGameEvents.TurnEnded, successResponse(session));
            this.logger.log(`Player ${socket.id} ended turn in session ${session.id}`);
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
    toggleDoorAction(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.inGameService.toggleDoorAction(payload.sessionId, socket.id, payload.x, payload.y);
        } catch (error) {
            socket.emit(InGameEvents.ToggleDoorAction, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerMove)
    playerMove(socket: Socket, payload: { sessionId: string; orientation: Orientation }): void {
        try {
            this.inGameService.movePlayer(payload.sessionId, socket.id, payload.orientation);
        } catch (error) {
            socket.emit(InGameEvents.PlayerMoved, errorResponse(error.message));
        }
    }

    @OnEvent('turn.started')
    handleTurnStarted(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnStarted, successResponse(payload.session));
        this.inGameService.getReachableTiles(payload.session.id, payload.session.currentTurn.activePlayerId);
        this.inGameService.getAvailableActions(payload.session.id, payload.session.currentTurn.activePlayerId);
        this.logger.log(`Turn ${payload.session.currentTurn.turnNumber} started for session ${payload.session.id}`);
    }

    @OnEvent('turn.ended')
    handleTurnEnded(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnEnded, successResponse(payload.session));
        this.logger.log(`Turn ${payload.session.currentTurn.turnNumber - 1} ended for session ${payload.session.id}`);
    }

    @OnEvent('turn.transition')
    handleTurnTransition(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnTransitionEnded, successResponse(payload.session));
        this.logger.log(`Transition → Turn ${payload.session.currentTurn.turnNumber} in session ${payload.session.id}`);
    }

    @OnEvent('turn.timeout')
    handleTurnTimeout(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnTimeout, successResponse(payload.session));
        this.logger.warn(`Timeout for session ${payload.session.id}`);
    }

    @OnEvent('turn.forcedEnd')
    handleForcedEnd(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnForcedEnd, successResponse(payload.session));
        this.logger.warn(`Forced end of turn for session ${payload.session.id}`);
    }

    @OnEvent('door.toggled')
    handleDoorToggled(payload: { session: InGameSession; playerId: string; x: number; y: number; isOpen: boolean }) {
        this.server
            .to(payload.session.inGameId)
            .emit(InGameEvents.DoorToggled, successResponse({ x: payload.x, y: payload.y, isOpen: payload.isOpen }));
        this.server.to(payload.playerId).emit(InGameEvents.PlayerActionUsed, successResponse({}));
    }

    @OnEvent('player.moved')
    handlePlayerMoved(payload: { session: InGameSession; playerId: string; x: number; y: number; speed: number }) {
        this.server
            .to(payload.session.inGameId)
            .emit(
                InGameEvents.PlayerMoved,
                successResponse({ playerId: payload.playerId, x: payload.x, y: payload.y, speed: payload.speed }),
            );
        this.logger.log(`Player ${payload.playerId} moved to ${payload.x}, ${payload.y} in session ${payload.session.id}`);
    }

    @OnEvent('player.reachableTiles')
    handlePlayerReachableTiles(payload: { playerId: string; reachable: ReachableTile[] }) {
        this.server.to(payload.playerId).emit(InGameEvents.PlayerReachableTiles, successResponse(payload.reachable));
    }

    @OnEvent('player.updated')
    handlePlayerUpdated(payload: { sessionId: string; player: Player }) {
        const session = this.inGameService.getSession(payload.sessionId);
        this.logger.log('player updated sent to client', payload);
        this.server.to(session.inGameId).emit(InGameEvents.PlayerUpdated, successResponse(payload.player));
        this.logger.log(`Player ${payload.player.id} updated in session ${payload.sessionId}`);
    }

    @OnEvent('player.availableActions')
    handlePlayerAvailableActions(payload: { session: InGameSession; playerId: string; actions: AvailableAction[] }) {
        this.server.to(payload.playerId).emit(InGameEvents.PlayerAvailableActions, successResponse(payload.actions));
        this.logger.log(`Player ${payload.playerId} has ${payload.actions.length} available actions in session ${payload.session.id}`);
    }

    @OnEvent('game.over')
    handleGameOver(payload: { sessionId: string; winnerId: string; winnerName: string }) {
        const session = this.inGameService.getSession(payload.sessionId);
        this.server.to(session.inGameId).emit(InGameEvents.GameOver, successResponse({ winnerId: payload.winnerId, winnerName: payload.winnerName }));

        this.server.socketsLeave(session.inGameId);
        this.server.socketsLeave(session.id);
        this.logger.log(`Game over for session ${payload.sessionId}. Winner: ${payload.winnerName} (${payload.winnerId})`);
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
                this.server.to(result.session.inGameId).emit(InGameEvents.GameForceStopped, successResponse({}));
                this.server.socketsLeave(sessionId);
            } else {
                this.server.to(result.session.inGameId).emit(InGameEvents.PlayerLeftInGameSession, successResponse(result));
                this.logger.log(`Player ${result.playerName} left session ${sessionId}`);
            }
        } catch (error) {
            this.server.to(playerId).emit(InGameEvents.PlayerLeftInGameSession, errorResponse(error.message));
        }
    }
}
