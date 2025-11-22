import { AVATAR_SELECTION_ROOM_PREFIX } from '@app/constants/session.constants';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { AddVirtualPlayerDto } from '@app/modules/session/dto/add-virtual-player.dto';
import { AvailableSessionsUpdatedDto } from '@app/modules/session/dto/available-sessions-updated.dto';
import { CreateSessionDto, SessionCreatedDto } from '@app/modules/session/dto/create-session.dto';
import { AvatarSelectionJoinedDto, JoinAvatarSelectionDto } from '@app/modules/session/dto/join-avatar-selection';
import { JoinSessionDto, SessionJoinedDto } from '@app/modules/session/dto/join-session.dto';
import { KickPlayerDto } from '@app/modules/session/dto/kick-player.dto';
import { AvatarAssignmentsUpdatedDto, UpdateAvatarAssignmentsDto } from '@app/modules/session/dto/update-avatar-assignments.dto';
import { SessionPlayersUpdatedDto } from '@app/modules/session/dto/update-session.dto';
import { SessionService } from '@app/modules/session/services/session.service';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { NotificationEvents } from '@common/enums/notification-events.enum';
import { ServerEvents } from '@app/enums/server-events.enum';
import { SessionEvents } from '@common/enums/session-events.enum';
import { SocketResponse } from '@common/types/socket-response.type';
import { Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';

@UsePipes(
    new ValidationPipe({
        transform: true,
        exceptionFactory: validationExceptionFactory,
    }),
)
@WebSocketGateway({
    cors: true,
})
@Injectable()
export class SessionGateway implements OnGatewayDisconnect {
    @WebSocketServer() private readonly server: Server;

    constructor(
        private readonly sessionService: SessionService,
        private readonly inGameService: InGameService,
    ) {}

    @SubscribeMessage(SessionEvents.CreateSession)
    createSession(socket: Socket, data: CreateSessionDto): void {
        try {
            const adminId = socket.id;
            const sessionData = this.sessionService.createSession(adminId, data);
            void socket.join(sessionData.sessionId);
            void socket.join(sessionData.chatId);

            const players = this.sessionService.getPlayersSession(sessionData.sessionId);
            const sessionCreatedDto: SessionCreatedDto = { sessionId: sessionData.sessionId, playerId: adminId, chatId: sessionData.chatId };
            socket.emit(SessionEvents.SessionCreated, successResponse<SessionCreatedDto>(sessionCreatedDto));
            socket.emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));
            this.handleAvailabilityChange();
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(SessionEvents.JoinSession)
    joinSession(socket: Socket, data: JoinSessionDto): void {
        const validationError = this.validateSessionJoin(data.sessionId);
        if (validationError) {
            socket.emit(NotificationEvents.ErrorMessage, validationError);
            return;
        }
        const modifiedPlayerName = this.handleJoinSession(socket, data);
        const session = this.sessionService.getSession(data.sessionId);
        const players = this.sessionService.getPlayersSession(data.sessionId);
        const dto: SessionJoinedDto = {
            gameId: session.gameId,
            maxPlayers: session.maxPlayers,
            chatId: session.chatId,
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
            socket.emit(NotificationEvents.ErrorMessage, validationError);
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

            const avatarAssignments = this.sessionService.getChosenAvatars(sessionId);
            const avatarRoomId = this.getAvatarSelectionRoomId(sessionId);
            this.server
                .to(avatarRoomId)
                .emit(SessionEvents.AvatarAssignmentsUpdated, successResponse<AvatarAssignmentsUpdatedDto>({ avatarAssignments }));

            this.handleAvailabilityChange();
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(SessionEvents.AddVirtualPlayer)
    addVirtualPlayer(socket: Socket, data: AddVirtualPlayerDto): void {
        const players = this.sessionService.addVirtualPlayer(data.sessionId, data.virtualPlayerType);
        this.server.to(data.sessionId).emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));

        const roomId = this.getAvatarSelectionRoomId(data.sessionId);
        const avatarAssignments = this.sessionService.getChosenAvatars(data.sessionId);
        this.server.to(roomId).emit(SessionEvents.AvatarAssignmentsUpdated, successResponse<AvatarAssignmentsUpdatedDto>({ avatarAssignments }));

        this.handleAvailabilityChange();
    }

    @SubscribeMessage(SessionEvents.StartGameSession)
    async startGameSession(socket: Socket): Promise<void> {
        try {
            const sessionId = this.sessionService.getPlayerSessionId(socket.id);
            
            if (!sessionId) {
                socket.emit(NotificationEvents.ErrorMessage, errorResponse('Joueur non connecté à une session'));
                return;
            }

            const waitingSession = this.sessionService.getSession(sessionId);
            if (!waitingSession) {
                socket.emit(NotificationEvents.ErrorMessage, errorResponse('Session introuvable'));
                return;
            }

            const inGameSession = await this.inGameService.createInGameSession(waitingSession, GameMode.CLASSIC, MapSize.SMALL);
            
            const players = this.sessionService.getPlayersSession(sessionId);

            for (const player of players) {
                if (!player.virtualPlayerType) {
                    const playerSocket = this.server.sockets.sockets.get(player.id);
                    if (playerSocket) {
                        void playerSocket.join(inGameSession.inGameId);
                    }
                }
            }

            this.server.to(sessionId).emit(SessionEvents.GameSessionStarted, successResponse({}));

            for (const player of players) {
                if (!player.virtualPlayerType) {
                    const playerSocket = this.server.sockets.sockets.get(player.id);
                    if (playerSocket) {
                        void playerSocket.leave(sessionId);
                    }
                }
            }
            this.sessionService.endSession(sessionId);
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message || 'Erreur lors du démarrage de la partie'));
        }
    }

    @SubscribeMessage(SessionEvents.LeaveSession)
    leaveSession(socket: Socket): void {
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
                this.sessionService.releaseAvatar(sessionId, player.id);
            }

            this.sessionService.endSession(sessionId);
            this.handleAvailabilityChange();
            return;
        }

        void socket.leave(sessionId);
        this.sessionService.leaveSession(sessionId, socket.id);

        const players = this.sessionService.getPlayersSession(sessionId);
        this.server.to(sessionId).emit(SessionEvents.SessionPlayersUpdated, successResponse<SessionPlayersUpdatedDto>({ players }));

        const avatarAssignments = this.sessionService.getChosenAvatars(sessionId);
        const avatarRoomId = this.getAvatarSelectionRoomId(sessionId);
        this.server
            .to(avatarRoomId)
            .emit(SessionEvents.AvatarAssignmentsUpdated, successResponse<AvatarAssignmentsUpdatedDto>({ avatarAssignments }));

        this.handleAvailabilityChange();
    }

    handleDisconnect(socket: Socket): void {
        this.leaveSession(socket);
    }

    @SubscribeMessage(SessionEvents.LoadAvailableSessions)
    loadAvailableSessions(socket: Socket): void {
        const sessions = this.sessionService.getAvailableSessions();
        socket.emit(SessionEvents.AvailableSessionsUpdated, successResponse<AvailableSessionsUpdatedDto>({ sessions }));
    }

    @OnEvent(ServerEvents.SessionAvailabilityChanged)
    handleAvailabilityChange(): void {
        const sessions = this.sessionService.getAvailableSessions();
        this.server.emit(SessionEvents.AvailableSessionsUpdated, successResponse<AvailableSessionsUpdatedDto>({ sessions }));
    }

    @OnEvent(ServerEvents.SessionAutoLocked)
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
        
        const session = this.sessionService.getSession(data.sessionId);
        void socket.join(session.chatId);

        return this.sessionService.joinSession(socket.id, data);
    }

    private getAvatarSelectionRoomId(sessionId: string): string {
        return `${AVATAR_SELECTION_ROOM_PREFIX}${sessionId}`;
    }
}
