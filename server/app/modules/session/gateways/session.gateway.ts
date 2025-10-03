import { CreateSessionDto, SessionCreatedDto } from '@app/modules/session/dto/create-session.dto';
import { AvatarSelectionJoinedDto, JoinAvatarSelectionDto } from '@app/modules/session/dto/join-avatar-selection';
import { JoinSessionDto } from '@app/modules/session/dto/join-session.dto';
import { AvatarAssignmentsUpdatedDto, UpdateAvatarAssignmentsDto } from '@app/modules/session/dto/update-avatar-assignments.dto';
import { SessionPlayersUpdatedDto } from '@app/modules/session/dto/update-session.dto';
import { VoidDto } from '@app/modules/session/dto/void.dto';
import { SessionService } from '@app/modules/session/services/session.service';
import { AVATAR_SELECTION_ROOM_PREFIX } from '@app/modules/session/services/session.service.constants';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { SessionEvents } from '@common/constants/session-events';
import { Player } from '@common/models/player.model';
import { SocketResponse } from '@common/types/socket-response.type';
import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UsePipes(new ValidationPipe({ transform: true }))
@WebSocketGateway({
    cors: true,
})
@Injectable()
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer() private server: Server;
    private readonly logger = new Logger(SessionGateway.name);

    constructor(
        private readonly sessionService: SessionService,
    ) {}

    @SubscribeMessage(SessionEvents.CreateSession)
    createSession(socket: Socket, data: CreateSessionDto) {
        const adminId = socket.id;
        const sessionId = this.sessionService.createSession(adminId, data);

        socket.join(sessionId);
        this.logger.log(`[CreateSession] Session created successfully: ${sessionId}`);
        this.sessionService.debugSessions();
        const players = this.sessionService.getPlayersSession(sessionId);
        socket.emit(SessionEvents.SessionCreated, successResponse<SessionCreatedDto>({ sessionId, playerId: adminId }));
        socket.emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));
    }

    @SubscribeMessage(SessionEvents.JoinSession)
    async joinSession(socket: Socket, data: JoinSessionDto) {
        const validationError = this.validateSessionJoin(data.sessionId);
        if (validationError) {
            socket.emit(SessionEvents.SessionJoined, validationError);
            return;
        }
        const players = this.handleJoinSession(socket, data);
        socket.emit(SessionEvents.SessionJoined, successResponse<VoidDto>({}));
        this.server.to(data.sessionId).emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));
    }

    @SubscribeMessage(SessionEvents.JoinAvatarSelection)
    async joinAvatarSelection(socket: Socket, data: JoinAvatarSelectionDto) {
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
    async updateAvatarAssignments(socket: Socket, data: UpdateAvatarAssignmentsDto) {
        const roomId = this.getAvatarSelectionRoomId(data.sessionId);
        this.sessionService.chooseAvatar(data.sessionId, socket.id, data.avatar);
        const avatarAssignments = this.sessionService.getChosenAvatars(data.sessionId);
        this.logger.warn(`[UPDATE_AVATAR_ASSIGNMENTS] Avatar assignments updated: ${JSON.stringify(avatarAssignments, null, 2)}`);

        this.server.to(roomId).emit(SessionEvents.AvatarAssignmentsUpdated, successResponse<AvatarAssignmentsUpdatedDto>({ avatarAssignments }));
    }

    @SubscribeMessage(SessionEvents.LockSession)
    lockSession(socket: Socket) {
        const sessionId = this.sessionService.getPlayerSessionId(socket.id);
        this.sessionService.lock(sessionId);
    }

    @SubscribeMessage(SessionEvents.UnlockSession)
    unlockSession(socket: Socket) {
        const sessionId = this.sessionService.getPlayerSessionId(socket.id);
        this.sessionService.unlock(sessionId);
    }

    // @SubscribeMessage(SessionEvents.StartGameSession)
    // startGameSession(socket: Socket, data: StartGameSessionDto) {
    //     const sessionId = this.sessionService.getPlayerSessionId(socket.id);
    //     this.gameSessionService.startGameSession(sessionId, data.gameSession);
    //     this.server.to(sessionId).emit(SessionEvents.GameSessionStarted, successResponse<StartGameSessionDto>(data));
    // }

    @SubscribeMessage(SessionEvents.LeaveSession)
    leaveSession(socket: Socket, sessionId: string) {
        this.logger.log(`[LEAVE] session: ${JSON.stringify(sessionId, null, 2)}`);
        this.sessionService.debugSessions();
        // const session = this.sessionService.getSession(sessionId);
        // const isAdmin = socket.id === session.adminId;

        // if (isAdmin) {
        //     this.logger.log(`[LEAVE] Admin ${socket.id} left. Session ${sessionId} ended.`);

        //     this.server.to(sessionId).emit(SessionEvents.SessionEnded, { success: true, message: 'Admin left, session ended.' });

        //     for (const player of session.players) {
        //         this.server.sockets.sockets.get(player.id).leave(sessionId);
        //     }

        //     this.sessionService.endSession(sessionId);
        //     return;
        // }

        socket.leave(sessionId);
        this.sessionService.leaveSession(sessionId, socket.id);
        this.logger.log(`[LEAVE] Player ${socket.id} left session: ${sessionId}`);

        this.server.to(sessionId).emit(SessionEvents.SessionLeft, { playerId: socket.id });
    }

    afterInit() {
        this.logger.log('SessionGateway initialized');
    }

    handleConnection(socket: Socket) {
        this.logger.log(`[CONNECTION]Player ${socket.id} connected`);
        // socket.emit(SessionEvents.Hello, 'Hello World!');
    }

    handleDisconnect(socket: Socket) {
        this.logger.log(`[DISCONNECT] Player ${socket.id} disconnected.`);
        const sessionId = this.sessionService.getPlayerSessionId(socket.id);

        if (!sessionId) {
            return;
        }

        this.leaveSession(socket, sessionId);
        this.logger.log(`[LEAVE] Player ${socket.id} left session: ${sessionId}`);
    }

    private getRoom(accessCode: string): Set<string> | undefined {
        return this.server.sockets.adapter.rooms.get(accessCode);
    }

    private validateSessionJoin(sessionId: string): SocketResponse<null> | null {
        const room = this.getRoom(sessionId);

        if (!room) {
            this.logger.warn(`Attempted to join a non-existing room: ${sessionId}`);
            return errorResponse('Session non trouvée');
        }

        if (this.sessionService.isRoomLocked(sessionId)) {
            this.logger.warn(`Attempted to join a locked room: ${sessionId}`);
            return errorResponse('Session est verrouillée');
        }

        return null;
    }

    private handleJoinSession(socket: Socket, data: JoinSessionDto): Player[] {
        socket.leave(this.getAvatarSelectionRoomId(data.sessionId));
        socket.join(data.sessionId);

        this.sessionService.joinSession(socket.id, data);
        this.logger.log(`Session joined: ${data.sessionId} by ${socket.id}`);
        return this.sessionService.getPlayersSession(data.sessionId);
    }

    private getAvatarSelectionRoomId(sessionId: string): string {
        return `${AVATAR_SELECTION_ROOM_PREFIX}${sessionId}`;
    }
}
