import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InGameService } from '@app/modules/in-game/services/in-game.service';
import { InGameEvents } from '@common/constants/in-game-events';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { InGameSession } from '@common/models/session.interface';

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

    @SubscribeMessage(InGameEvents.PlayerJoinInGameSession)
    playerJoinInGameSession(socket: Socket, sessionId: string): void {
        try {
            const inGameSession = this.inGameService.joinInGameSession(sessionId, socket.id);
            this.server.to(inGameSession.id).emit(InGameEvents.PlayerJoinedInGameSession, successResponse(inGameSession));
        } catch (error) {
            socket.emit(InGameEvents.PlayerJoinedInGameSession, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.GameStart)
    async startGame(socket: Socket, sessionId: string): Promise<void> {
        try {
            const inGameSession = this.inGameService.getInGameSession(sessionId);
            if (!inGameSession) throw new Error('Session not found');

            this.inGameService.startGame(sessionId, {
                endTurnCallback: (updated) => {
                    this.server.to(inGameSession.id).emit(InGameEvents.TurnEnded, successResponse(updated));
                },
                transitionCallback: () => {
                    this.server.to(inGameSession.id).emit(InGameEvents.TurnTransitionEnded, successResponse({}));
                    this.server.to(inGameSession.id).emit(InGameEvents.TurnStarted, successResponse({}));
                },
                gameOverCallback: (session) => {
                    this.server.to(session.id).emit(InGameEvents.GameOver, successResponse(session));
                },
            });

            this.server.to(inGameSession.id).emit(InGameEvents.TurnStarted, successResponse({}));
        } catch (error) {
            socket.emit(InGameEvents.TurnStarted, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.TurnEnd)
    playerEndTurn(socket: Socket, sessionId: string): void {
        try {
            const inGameSession = this.inGameService.getInGameSession(sessionId);
            if (!inGameSession) throw new Error('Session not found');

            this.inGameService.playerEndTurn(sessionId, socket.id, {
                endTurnCallback: (updated) => {
                    this.server.to(inGameSession.id).emit(InGameEvents.TurnEnded, successResponse(updated));
                },
                transitionCallback: () => {
                    this.server.to(inGameSession.id).emit(InGameEvents.TurnTransitionEnded, successResponse({}));
                    this.server.to(inGameSession.id).emit(InGameEvents.TurnStarted, successResponse({}));
                },
                gameOverCallback: (session) => {
                    this.server.to(session.id).emit(InGameEvents.GameOver, successResponse(session));
                },
            });
        } catch (error) {
            socket.emit(InGameEvents.TurnEnded, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.LeaveInGameSession)
    leaveInGameSession(socket: Socket, sessionId: string): void {
        try {
            const inGameSession = this.inGameService.getInGameSession(sessionId);
            if (!inGameSession) throw new Error('In game session not found');

            const updated = this.inGameService.leaveInGameSession(sessionId, socket.id);
            this.server.to(inGameSession.id).emit(InGameEvents.InGameSessionLeft, successResponse<InGameSession>(updated));
            socket.leave(inGameSession.id);
        } catch (error) {
            socket.emit(InGameEvents.InGameSessionLeft, errorResponse(error.message));
        }
    }
}
