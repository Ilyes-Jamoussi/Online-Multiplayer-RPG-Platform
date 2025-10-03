import { Injectable } from '@angular/core';
import { SessionPlayersUpdatedDto } from '@app/dto/session-players-updated-dto';
import { CreateSessionDto } from '@app/dto/create-session-dto';
import { SessionCreatedDto } from '@app/dto/session-created-dto';
import { AvatarSelectionJoinedDto } from '@app/dto/avatar-selection-joined-dto';
import { JoinAvatarSelectionDto } from '@app/dto/join-avatar-selection-dto';
import { JoinSessionDto } from '@app/dto/join-session-dto';
import { StartGameSessionDto } from '@app/dto/start-game-session-dto';
import { AvatarAssignmentsUpdatedDto } from '@app/dto/avatar-assignments-updated-dto';
import { UpdateAvatarAssignmentsDto } from '@app/dto/update-avatar-assignments-dto';
import { SocketService } from '@app/services/socket/socket.service';
import { SessionEvents } from '@common/constants/session-events';

@Injectable({ providedIn: 'root' })
export class SessionSocketService {
    constructor(private readonly socket: SocketService) {}

    createSession(data: CreateSessionDto): void {
        this.socket.emit(SessionEvents.CreateSession, data);
    }

    lockSession(data: {}): void {
        this.socket.emit(SessionEvents.LockSession, data);
    }

    unlockSession(data: {}): void {
        this.socket.emit(SessionEvents.UnlockSession, data);
    }

    onSessionCreated(callback: (data: SessionCreatedDto) => void): void {
        this.socket.onSuccessEvent(SessionEvents.SessionCreated, callback);
    }

    onSessionCreatedError(callback: (msg: string) => void): void {
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

    onSessionJoined(callback: (data: {}) => void): void {
        this.socket.onSuccessEvent(SessionEvents.SessionJoined, callback);
    }

    onSessionJoinError(callback: (msg: string) => void): void {
        this.socket.onErrorEvent(SessionEvents.SessionJoined, callback);
    }

    updateAvatarsAssignment(data: UpdateAvatarAssignmentsDto): void {
        this.socket.emit(SessionEvents.UpdateAvatarAssignments, data);
    }

    startGameSession(data: StartGameSessionDto): void {
        this.socket.emit(SessionEvents.StartGameSession, data);
    }

    onGameSessionStarted(callback: (data: StartGameSessionDto) => void): void {
        this.socket.onSuccessEvent(SessionEvents.GameSessionStarted, callback);
    }

    onAvatarAssignmentsUpdated(callback: (data: AvatarAssignmentsUpdatedDto) => void): void {
        this.socket.onSuccessEvent(SessionEvents.AvatarAssignmentsUpdated, callback);
    }

    onSessionPlayersUpdated(callback: (data: SessionPlayersUpdatedDto) => void): void {
        this.socket.onSuccessEvent(SessionEvents.SessionPlayersUpdated, callback);
    }
}
