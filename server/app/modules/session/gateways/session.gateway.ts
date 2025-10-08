import { CreateSessionDto, SessionCreatedDto } from '@app/modules/session/dto/create-session.dto';
import { AvatarSelectionJoinedDto, JoinAvatarSelectionDto } from '@app/modules/session/dto/join-avatar-selection';
import { JoinSessionDto, SessionJoinedDto } from '@app/modules/session/dto/join-session.dto';
import { KickPlayerDto } from '@app/modules/session/dto/kick-player.dto';
import { AvatarAssignmentsUpdatedDto, UpdateAvatarAssignmentsDto } from '@app/modules/session/dto/update-avatar-assignments.dto';
import { SessionPlayersUpdatedDto } from '@app/modules/session/dto/update-session.dto';
import { SessionService } from '@app/modules/session/services/session.service';
import { AVATAR_SELECTION_ROOM_PREFIX } from '@app/modules/session/services/session.service.constants';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { SessionEvents } from '@common/constants/session-events';
import { Player } from '@common/models/player.interface';
import { SocketResponse } from '@common/types/socket-response.type';
import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UsePipes(new ValidationPipe({
    transform: true,
    exceptionFactory: (errors): Error => {
        new Logger('ValidationPipe').error('Validation failed:', errors);
        throw new Error('Validation failed');
    }
}))
@WebSocketGateway({
    cors: true,
})
@Injectable()
export class SessionGateway implements OnGatewayDisconnect {
    @WebSocketServer() private readonly server: Server;
    private readonly logger = new Logger(SessionGateway.name);

    constructor(
        private readonly sessionService: SessionService,
    ) {}

    @SubscribeMessage(SessionEvents.CreateSession)
    createSession(socket: Socket, data: CreateSessionDto): void {
        try {
            const adminId = socket.id;
            const sessionId = this.sessionService.createSession(adminId, data);
            socket.join(sessionId);

            const players = this.sessionService.getPlayersSession(sessionId);
            socket.emit(SessionEvents.SessionCreated, successResponse<SessionCreatedDto>({ sessionId, playerId: adminId }));
            socket.emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));

        } catch (error) {
            socket.emit(SessionEvents.SessionCreated, errorResponse(error.message));
        }
    }

    @SubscribeMessage(SessionEvents.JoinSession)
    async joinSession(socket: Socket, data: JoinSessionDto): Promise<void> {
        const validationError = this.validateSessionJoin(data.sessionId);
        if (validationError) {
            socket.emit(SessionEvents.SessionJoined, validationError);
            return;
        }
        const players = this.handleJoinSession(socket, data);
        const session = this.sessionService.getSession(data.sessionId);
        socket.emit(SessionEvents.SessionJoined, successResponse<SessionJoinedDto>({ 
            gameId: session.gameId, 
            maxPlayers: session.maxPlayers 
        }));
        this.server.to(data.sessionId).emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));
    }

    @SubscribeMessage(SessionEvents.JoinAvatarSelection)
    async joinAvatarSelection(socket: Socket, data: JoinAvatarSelectionDto): Promise<void> {
        const validationError = this.validateSessionJoin(data.sessionId);
        if (validationError) {
            socket.emit(SessionEvents.AvatarSelectionJoined, validationError);
            return;
        }
        socket.join(this.getAvatarSelectionRoomId(data.sessionId));

        const avatarAssignments = this.sessionService.getChosenAvatars(data.sessionId);
        socket.emit(SessionEvents.AvatarSelectionJoined, successResponse<AvatarSelectionJoinedDto>({ playerId: socket.id }));
        socket.emit(SessionEvents.AvatarAssignmentsUpdated, successResponse<AvatarAssignmentsUpdatedDto>({ avatarAssignments }));
    }

    @SubscribeMessage(SessionEvents.UpdateAvatarAssignments)
    async updateAvatarAssignments(socket: Socket, data: UpdateAvatarAssignmentsDto): Promise<void> {
        const roomId = this.getAvatarSelectionRoomId(data.sessionId);
        this.sessionService.chooseAvatar(data.sessionId, socket.id, data.avatar);
        const avatarAssignments = this.sessionService.getChosenAvatars(data.sessionId);

        this.server.to(roomId).emit(SessionEvents.AvatarAssignmentsUpdated, successResponse<AvatarAssignmentsUpdatedDto>({ avatarAssignments }));
    }

    @SubscribeMessage(SessionEvents.LockSession)
    lockSession(socket: Socket): void {
        const sessionId = this.sessionService.getPlayerSessionId(socket.id);
        this.sessionService.lock(sessionId);
    }

    @SubscribeMessage(SessionEvents.UnlockSession)
    unlockSession(socket: Socket): void {
        const sessionId = this.sessionService.getPlayerSessionId(socket.id);
        this.sessionService.unlock(sessionId);
    }

    @SubscribeMessage(SessionEvents.KickPlayer)
    kickPlayer(socket: Socket, data: KickPlayerDto): void {
        try {
            const sessionId = this.sessionService.getPlayerSessionId(socket.id);

            this.sessionService.kickPlayer(sessionId, data.playerId);

            const kickedSocket = this.server.sockets.sockets.get(data.playerId);
            if (kickedSocket) {
                kickedSocket.leave(sessionId);
                kickedSocket.emit(SessionEvents.PlayerKicked, successResponse({ message: 'Vous avez été exclu de la session' }));
            }

            const players = this.sessionService.getPlayersSession(sessionId);
            this.server.to(sessionId).emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));

        } catch (error) {
            socket.emit(SessionEvents.PlayerKicked, errorResponse(error.message));
        }
    }

    @SubscribeMessage(SessionEvents.StartGameSession)
    startGameSession(socket: Socket): void {
        const sessionId = this.sessionService.getPlayerSessionId(socket.id);
        this.server.to(sessionId).emit(SessionEvents.GameSessionStarted, successResponse({}));
    }

    @SubscribeMessage(SessionEvents.LeaveSession)
    leaveSession(socket: Socket): void {
        try {
            const sessionId = this.sessionService.getPlayerSessionId(socket.id);
            if (!sessionId) return;

            const session = this.sessionService.getSession(sessionId);
            const isAdmin = this.sessionService.isAdmin(socket.id);

            if (isAdmin) {
                socket.broadcast.to(sessionId).emit(SessionEvents.SessionEnded, successResponse({ message: 'L\'organisateur a quitté' }));

                for (const player of session.players) {
                    const playerSocket = this.server.sockets.sockets.get(player.id);
                    if (playerSocket) {
                        playerSocket.leave(sessionId);
                    }
                }

                this.sessionService.endSession(sessionId);
                return;
            }

            socket.leave(sessionId);
            this.sessionService.leaveSession(sessionId, socket.id);

            const players = this.sessionService.getPlayersSession(sessionId);
            this.server.to(sessionId).emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));

        } catch (error) {
            this.logger.error('Error leaving session:', error.message);
        }
    }

    handleDisconnect(socket: Socket): void {
        this.leaveSession(socket);
    }

    private getRoom(accessCode: string): Set<string> | undefined {
        return this.server.sockets.adapter.rooms.get(accessCode);
    }

    private validateSessionJoin(sessionId: string): SocketResponse<null> | null {
        const room = this.getRoom(sessionId);

        if (!room) {
            return errorResponse('Session non trouvée');
        }

        if (this.sessionService.isRoomLocked(sessionId)) {
            return errorResponse('Session est verrouillée');
        }

        if (this.sessionService.isSessionFull(sessionId)) {
            return errorResponse('Session est pleine');
        }

        return null;
    }

    private handleJoinSession(socket: Socket, data: JoinSessionDto): Player[] {
        socket.leave(this.getAvatarSelectionRoomId(data.sessionId));
        socket.join(data.sessionId);

        this.sessionService.joinSession(socket.id, data);
        return this.sessionService.getPlayersSession(data.sessionId);
    }

    private getAvatarSelectionRoomId(sessionId: string): string {
        return `${AVATAR_SELECTION_ROOM_PREFIX}${sessionId}`;
    }
}
