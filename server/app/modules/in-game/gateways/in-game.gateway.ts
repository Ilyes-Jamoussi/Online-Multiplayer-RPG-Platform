import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InGameService } from '@app/modules/in-game/services/in-game.service';
import { InGameEvents } from '@common/constants/in-game-events';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { InGameSession } from '@common/models/session.interface';
import { OnEvent } from '@nestjs/event-emitter';

@UsePipes(
    new ValidationPipe({
        transform: true,
        exceptionFactory: (errors): Error => {
            new Logger('ValidationPipe').error('Validation failed:', errors);
            throw new Error('Validation failed');
        },
    }),
)
@WebSocketGateway({ cors: true })
@Injectable()
export class InGameGateway {
    @WebSocketServer() private readonly server: Server;
    private readonly logger = new Logger(InGameGateway.name);

    constructor(private readonly inGameService: InGameService) {}

    // --- SOCKET HANDLERS -----------------------------------------------------

    @SubscribeMessage(InGameEvents.PlayerJoinInGameSession)
    playerJoinInGameSession(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.joinInGameSession(sessionId, socket.id);
            this.server.to(session.inGameId).emit(InGameEvents.PlayerJoinedInGameSession, successResponse(session));
            this.logger.log(`Player ${socket.id} joined session ${session.id}`);
        } catch (error) {
            socket.emit(InGameEvents.PlayerJoinedInGameSession, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.GameStart)
    async startGame(socket: Socket, sessionId: string): Promise<void> {
        try {
            const started = this.inGameService.startSession(sessionId);
            this.server.to(started.inGameId).emit(InGameEvents.GameStarted, successResponse(started));
            this.logger.log(`Game started for session ${started.inGameId}`);
        } catch (error) {
            socket.emit(InGameEvents.GameStarted, errorResponse(error.message));
        }
    }

    // @SubscribeMessage(InGameEvents.TurnEnd)
    // playerEndTurn(socket: Socket, sessionId: string): void {
    //     try {
    //         const session = this.inGameService.getSession(sessionId);
    //         if (!session) throw new Error('Session not found');
    //         this.inGameService.playerEndTurn(sessionId, socket.id);
    //     } catch (error) {
    //         socket.emit(InGameEvents.TurnEnded, errorResponse(error.message));
    //     }
    // }

    @SubscribeMessage(InGameEvents.LeaveInGameSession)
    leaveInGameSession(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.leaveInGameSession(sessionId, socket.id);
            socket.leave(session.inGameId);
            this.server.to(session.inGameId).emit(InGameEvents.LeftInGameSession, successResponse<InGameSession>(session));
            this.logger.log(`Socket ${socket.id} left session ${session.id}`);
        } catch (error) {
            socket.emit(InGameEvents.LeftInGameSession, errorResponse(error.message));
        }
    }

    @OnEvent('turn.started')
    handleTurnStarted(payload: { session: InGameSession }) {
        this.server.to(payload.session.inGameId).emit(InGameEvents.TurnStarted, successResponse(payload.session));
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
}
