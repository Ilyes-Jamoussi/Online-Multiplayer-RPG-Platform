import { Injectable } from '@angular/core';
import { AvatarAssignmentsUpdatedDto } from '@app/dto/avatar-assignments-updated-dto';
import { AvatarSelectionJoinedDto } from '@app/dto/avatar-selection-joined-dto';
import { CreateSessionDto } from '@app/dto/create-session-dto';
import { JoinAvatarSelectionDto } from '@app/dto/join-avatar-selection-dto';
import { JoinSessionDto } from '@app/dto/join-session-dto';
import { KickPlayerDto } from '@app/dto/kick-player-dto';
import { SessionCreatedDto } from '@app/dto/session-created-dto';
import { SessionJoinedDto } from '@app/dto/session-joined-dto';
import { SessionPlayersUpdatedDto } from '@app/dto/session-players-updated-dto';
import { UpdateAvatarAssignmentsDto } from '@app/dto/update-avatar-assignments-dto';
import { SocketService } from '@app/services/socket/socket.service';
import { SessionEvents } from '@common/constants/session-events';

@Injectable({ providedIn: 'root' })
export class SessionSocketService {
    constructor(private readonly socket: SocketService) {}

    createSession(data: CreateSessionDto): void {
        this.socket.emit(SessionEvents.CreateSession, data);
    }

    lockSession(): void {
        this.socket.emit(SessionEvents.LockSession, {});
    }

    unlockSession(): void {
        this.socket.emit(SessionEvents.UnlockSession, {});
    }

    startGameSession(): void {
        this.socket.emit(SessionEvents.StartGameSession, {});
    }

    onSessionCreated(callback: (data: SessionCreatedDto) => void): void {
        this.socket.onSuccessEvent(SessionEvents.SessionCreated, callback);
    }

    onSessionCreatedError(callback: (message: string) => void): void {
        this.socket.onErrorEvent(SessionEvents.SessionCreated, callback);
    }

    joinAvatarSelection(data: JoinAvatarSelectionDto): void {
        this.socket.emit(SessionEvents.JoinAvatarSelection, data);
    }

    onAvatarSelectionJoined(callback: (data: AvatarSelectionJoinedDto) => void): void {
        this.socket.onSuccessEvent(SessionEvents.AvatarSelectionJoined, callback);
    }

    onAvatarSelectionJoinError(callback: (msg: string) => void): void {
        this.socket.onErrorEvent(SessionEvents.AvatarSelectionJoined, callback);
    }

    joinSession(data: JoinSessionDto): void {
        this.socket.emit(SessionEvents.JoinSession, data);
    }

    onSessionJoined(callback: (data: SessionJoinedDto) => void): void {
        this.socket.onSuccessEvent(SessionEvents.SessionJoined, callback);
    }

    onSessionJoinError(callback: (msg: string) => void): void {
        this.socket.onErrorEvent(SessionEvents.SessionJoined, callback);
    }

    updateAvatarsAssignment(data: UpdateAvatarAssignmentsDto): void {
        this.socket.emit(SessionEvents.UpdateAvatarAssignments, data);
    }

    onAvatarAssignmentsUpdated(callback: (data: AvatarAssignmentsUpdatedDto) => void): void {
        this.socket.onSuccessEvent(SessionEvents.AvatarAssignmentsUpdated, callback);
    }

    onSessionPlayersUpdated(callback: (data: SessionPlayersUpdatedDto) => void): void {
        this.socket.onSuccessEvent(SessionEvents.SessionPlayersUpdated, callback);
    }

    kickPlayer(data: KickPlayerDto): void {
        this.socket.emit(SessionEvents.KickPlayer, data);
    }

    onPlayerKicked(callback: (data: { message: string }) => void): void {
        this.socket.onSuccessEvent(SessionEvents.PlayerKicked, callback);
    }

    onGameSessionStarted(callback: () => void): void {
        this.socket.onSuccessEvent(SessionEvents.GameSessionStarted, callback);
    }

    leaveSession(): void {
        this.socket.emit(SessionEvents.LeaveSession, {});
    }

    onSessionEnded(callback: (data: { message: string }) => void): void {
        this.socket.onSuccessEvent(SessionEvents.SessionEnded, callback);
    }
}
