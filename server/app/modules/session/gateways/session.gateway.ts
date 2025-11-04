import { AVATAR_SELECTION_ROOM_PREFIX } from '@app/constants/session.constants';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { AvailableSessionsUpdatedDto } from '@app/modules/session/dto/available-sessions-updated.dto';
import { CreateSessionDto, SessionCreatedDto } from '@app/modules/session/dto/create-session.dto';
import { AvatarSelectionJoinedDto, JoinAvatarSelectionDto } from '@app/modules/session/dto/join-avatar-selection';
import { JoinSessionDto, SessionJoinedDto } from '@app/modules/session/dto/join-session.dto';
import { KickPlayerDto } from '@app/modules/session/dto/kick-player.dto';
import { AvatarAssignmentsUpdatedDto, UpdateAvatarAssignmentsDto } from '@app/modules/session/dto/update-avatar-assignments.dto';
import { SessionPlayersUpdatedDto } from '@app/modules/session/dto/update-session.dto';
import { SessionService } from '@app/modules/session/services/session.service';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { SessionEvents } from '@common/enums/session-events.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { SocketResponse } from '@common/types/socket-response.type';
import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
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
@WebSocketGateway({
    cors: true,
})
@Injectable()
export class SessionGateway implements OnGatewayDisconnect {
    @WebSocketServer() private readonly server: Server;
    private readonly logger = new Logger(SessionGateway.name);

    constructor(
        private readonly sessionService: SessionService,
        private readonly inGameService: InGameService,
    ) {}

    @SubscribeMessage(SessionEvents.CreateSession)
    createSession(socket: Socket, data: CreateSessionDto): void {
        try {
            const adminId = socket.id;
            const sessionId = this.sessionService.createSession(adminId, data);
            void socket.join(sessionId);

            const players = this.sessionService.getPlayersSession(sessionId);
            socket.emit(SessionEvents.SessionCreated, successResponse<SessionCreatedDto>({ sessionId, playerId: adminId }));
            socket.emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));
            this.handleAvailabilityChange();
        } catch (error) {
            socket.emit(SessionEvents.SessionCreated, errorResponse(error.message));
        }
    }

    @SubscribeMessage(SessionEvents.JoinSession)
    joinSession(socket: Socket, data: JoinSessionDto): void {
        const validationError = this.validateSessionJoin(data.sessionId);
        if (validationError) {
            socket.emit(SessionEvents.SessionJoined, validationError);
            return;
        }
        const modifiedPlayerName = this.handleJoinSession(socket, data);
        const session = this.sessionService.getSession(data.sessionId);
        const players = this.sessionService.getPlayersSession(data.sessionId);
        const dto: SessionJoinedDto = {
            gameId: session.gameId,
            maxPlayers: session.maxPlayers,
        };

        if (modifiedPlayerName !== data.player.name) {
            dto.modifiedPlayerName = modifiedPlayerName;
        }
        socket.emit(SessionEvents.SessionJoined, successResponse(dto));
        this.server.to(data.sessionId).emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));
        this.handleAvailabilityChange();
    }

    @SubscribeMessage(SessionEvents.JoinAvatarSelection)
    joinAvatarSelection(socket: Socket, data: JoinAvatarSelectionDto): void {
        const validationError = this.validateSessionJoin(data.sessionId);
        if (validationError) {
            socket.emit(SessionEvents.AvatarSelectionJoined, validationError);
            return;
        }
        void socket.join(this.getAvatarSelectionRoomId(data.sessionId));

        const avatarAssignments = this.sessionService.getChosenAvatars(data.sessionId);
        socket.emit(
            SessionEvents.AvatarSelectionJoined,
            successResponse<AvatarSelectionJoinedDto>({
                playerId: socket.id,
                sessionId: data.sessionId,
            }),
        );
        socket.emit(SessionEvents.AvatarAssignmentsUpdated, successResponse<AvatarAssignmentsUpdatedDto>({ avatarAssignments }));
    }

    @SubscribeMessage(SessionEvents.LeaveAvatarSelection)
    leaveAvatarSelection(socket: Socket, data: JoinAvatarSelectionDto): void {
        const roomId = this.getAvatarSelectionRoomId(data.sessionId);
        void socket.leave(roomId);

        this.sessionService.releaseAvatar(data.sessionId, socket.id);
        const avatarAssignments = this.sessionService.getChosenAvatars(data.sessionId);

        this.server.to(roomId).emit(SessionEvents.AvatarAssignmentsUpdated, successResponse<AvatarAssignmentsUpdatedDto>({ avatarAssignments }));
    }

    @SubscribeMessage(SessionEvents.UpdateAvatarAssignments)
    updateAvatarAssignments(socket: Socket, data: UpdateAvatarAssignmentsDto): void {
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
                void kickedSocket.leave(sessionId);
                kickedSocket.emit(SessionEvents.SessionEnded, successResponse({ message: 'Vous avez été exclu de la session' }));
            }

            const players = this.sessionService.getPlayersSession(sessionId);
            this.server.to(sessionId).emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));
            this.handleAvailabilityChange();
        } catch (error) {
            socket.emit(SessionEvents.SessionEnded, errorResponse(error.message));
        }
    }

    @SubscribeMessage(SessionEvents.StartGameSession)
    async startGameSession(socket: Socket): Promise<void> {
        const sessionId = this.sessionService.getPlayerSessionId(socket.id);
        if (!sessionId) {
            socket.emit(SessionEvents.StartGameSession, errorResponse('Joueur non connecté à une session'));
            return;
        }

        const waitingSession = this.sessionService.getSession(sessionId);
        if (!waitingSession) {
            socket.emit(SessionEvents.StartGameSession, errorResponse('Session introuvable'));
            return;
        }

        let inGameSession;
        try {
            inGameSession = await this.inGameService.createInGameSession(
                waitingSession,
                GameMode.CLASSIC,
                MapSize.SMALL,
            );
        } catch (error) {
            socket.emit(SessionEvents.StartGameSession, errorResponse(error.message));
            return;
        }

        const players = this.sessionService.getPlayersSession(sessionId);

        for (const player of players) {
            const playerSocket = this.server.sockets.sockets.get(player.id);
            if (playerSocket) {
                void playerSocket.join(inGameSession.inGameId);
            }
        }

        this.server.to(sessionId).emit(SessionEvents.GameSessionStarted, successResponse({}));

        for (const player of players) {
            const playerSocket = this.server.sockets.sockets.get(player.id);
            if (playerSocket) {
                void playerSocket.leave(sessionId);
            }
        }
        this.sessionService.endSession(sessionId);
    }

    @SubscribeMessage(SessionEvents.LeaveSession)
    leaveSession(socket: Socket): void {
        try {
            const sessionId = this.sessionService.getPlayerSessionId(socket.id);
            if (!sessionId) return;

            const session = this.sessionService.getSession(sessionId);
            const isAdmin = this.sessionService.isAdmin(socket.id);

            if (isAdmin) {
                socket.broadcast.to(sessionId).emit(SessionEvents.SessionEnded, successResponse({ message: "L'organisateur a quitté" }));

                for (const player of session.players) {
                    const playerSocket = this.server.sockets.sockets.get(player.id);
                    if (playerSocket) {
                        void playerSocket.leave(sessionId);
                    }
                }

                this.sessionService.endSession(sessionId);
                this.handleAvailabilityChange();
                return;
            }

            void socket.leave(sessionId);
            this.sessionService.leaveSession(sessionId, socket.id);

            const players = this.sessionService.getPlayersSession(sessionId);
            this.server.to(sessionId).emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));
            this.handleAvailabilityChange();
        } catch (error) {
            this.logger.error('Error leaving session:', error.message);
        }
    }


    handleDisconnect(socket: Socket): void {
        this.leaveSession(socket);
    }

    @SubscribeMessage(SessionEvents.LoadAvailableSessions)
    loadAvailableSessions(socket: Socket): void {
        const sessions = this.sessionService.getAvailableSessions();
        socket.emit(SessionEvents.AvailableSessionsUpdated, successResponse<AvailableSessionsUpdatedDto>({ sessions }));
    }

    @OnEvent('session.availabilityChanged')
    handleAvailabilityChange(): void {
        const sessions = this.sessionService.getAvailableSessions();
        this.server.emit(SessionEvents.AvailableSessionsUpdated, successResponse<AvailableSessionsUpdatedDto>({ sessions }));
    }

    @OnEvent('session.autoLocked')
    handleAutoLocked(sessionId: string): void {
        this.server.to(sessionId).emit(SessionEvents.SessionAutoLocked, successResponse({}));
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

    private handleJoinSession(socket: Socket, data: JoinSessionDto): string {
        void socket.leave(this.getAvatarSelectionRoomId(data.sessionId));
        void socket.join(data.sessionId);

        return this.sessionService.joinSession(socket.id, data);
    }

    private getAvatarSelectionRoomId(sessionId: string): string {
        return `${AVATAR_SELECTION_ROOM_PREFIX}${sessionId}`;
    }
}
