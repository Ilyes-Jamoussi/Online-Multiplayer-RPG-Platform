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
@WebSocketGateway({
    cors: true,
})
@Injectable()
export class InGameGateway {
    @WebSocketServer() private readonly server: Server;
    private readonly logger = new Logger(InGameGateway.name);

    constructor(private readonly inGameService: InGameService) {}

    @SubscribeMessage(InGameEvents.PlayerJoinInGameSession)
    playerJoinInGameSession(socket: Socket, sessionId: string): void {
        try {
            const ingameSession = this.inGameService.joinInGameSession(socket.id, sessionId);
            socket.emit(InGameEvents.PlayerJoinedInGameSession, successResponse<InGameSession>(ingameSession));
        } catch (error) {
            socket.emit(InGameEvents.PlayerJoinedInGameSession, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.TurnStart)
    playerStartTurn(socket: Socket, sessionId: string): void {
        const inGameSession = this.inGameService.getInGameSession(sessionId);
        try {
            this.inGameService.startTurn(sessionId, socket.id, (updatedSession) => {
                this.server.to(sessionId).emit(InGameEvents.TurnEnded, successResponse(updatedSession));
            });
            const ingameSessionId = inGameSession.id;
            this.server.to(ingameSessionId).emit(InGameEvents.TurnStarted, successResponse({}));
        } catch (error) {
            socket.emit(InGameEvents.TurnStarted, errorResponse(error.message));
        }
    }
}
