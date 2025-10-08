import { computed, Injectable, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { DEFAULT_SESSION, MIN_SESSION_PLAYERS } from '@app/constants/session.constants';
import { CreateSessionDto } from '@app/dto/create-session-dto';
import { JoinSessionDto } from '@app/dto/join-session-dto';
import { NotificationService } from '@app/services/notification/notification.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { Avatar } from '@common/enums/avatar.enum';
import { MAP_SIZE_TO_MAX_PLAYERS, MapSize } from '@common/enums/map-size.enum';
import { Player } from '@common/models/player.interface';
import { AvatarAssignment, Session } from '@common/models/session.interface';


@Injectable({ providedIn: 'root' })
export class SessionService {
    private readonly _session = signal<Session>({ ...DEFAULT_SESSION });

    constructor(
        private readonly sessionSocketService: SessionSocketService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {
        this.initListeners();
    }

    get session(): Signal<Session> {
        return this._session.asReadonly();
    }

    get id(): Signal<string> {
        return computed(() => this.session().id);
    }

    get players(): Signal<Player[]> {
        return computed(() => this.session().players);
    }

    get avatarAssignments(): Signal<AvatarAssignment[]> {
        return computed(() => this.session().avatarAssignments);
    }

    get gameId(): Signal<string> {
        return computed(() => this.session().gameId);
    }

    get maxPlayers(): Signal<number> {
        return computed(() => this.session().maxPlayers);
    }

    get isRoomLocked(): Signal<boolean> {
        return computed(() => this.session().isRoomLocked);
    }

    updateSession(partial: Partial<Session>): void {
        this._session.update((session) => ({ ...session, ...partial }));
    }

    resetSession(): void {
        this._session.set({ ...DEFAULT_SESSION });
    }

    lock(): void {
        this.updateSession({ isRoomLocked: true });
        this.sessionSocketService.lockSession();
    }

    unlock(): void {
        this.updateSession({ isRoomLocked: false });
        this.sessionSocketService.unlockSession();
    }

    canBeLocked(): boolean {
        return !this.isRoomLocked();
    }

    canBeUnlocked(): boolean {
        return this.isRoomLocked() && this.players().length < this.maxPlayers();
    }

    canStartGame(): boolean {
        return this.isRoomLocked() && this.players().length >= MIN_SESSION_PLAYERS;
    }

    assignAvatar(playerId: string, avatar: Avatar): void {
        const updated = this._session().avatarAssignments.map((assignment) => {
            const isOldChoice = assignment.chosenBy === playerId;
            const isNewChoice = assignment.avatar === avatar;

            if (isOldChoice) return { ...assignment, chosenBy: null };
            if (isNewChoice) return { ...assignment, chosenBy: playerId };
            return assignment;
        });

        this.updateSession({ avatarAssignments: updated });
    }

    kickPlayer(playerId: string): void {
        this.sessionSocketService.kickPlayer({ playerId });
    }

    leaveSession(): void {
        this.sessionSocketService.leaveSession();
        this.resetSession();
        this.router.navigate([ROUTES.homePage]);
    }

    initializeSessionWithGame(gameId: string, mapSize: MapSize): void {
        const maxPlayers = MAP_SIZE_TO_MAX_PLAYERS[mapSize];
        this.updateSession({ gameId, maxPlayers });
    }

    createSession(player: Player): void {
        const session = this.session();
        const dto: CreateSessionDto = {
            gameId: session.gameId,
            maxPlayers: session.maxPlayers,
            player
        };
        this.sessionSocketService.createSession(dto);
    }

    joinSession(player: Player): void {
        const session = this.session();
        const dto: JoinSessionDto = {
            sessionId: session.id,
            player
        };
        this.sessionSocketService.joinSession(dto);
    }

    startGameSession(): void {
        this.sessionSocketService.startGameSession();
    }

    private initListeners(): void {
        this.sessionSocketService.onSessionPlayersUpdated((data) => this.updateSession({ players: data.players }));

        this.sessionSocketService.onSessionJoined((data) => this.updateSession({ 
            gameId: data.gameId, 
            maxPlayers: data.maxPlayers 
        }));

        this.sessionSocketService.onAvatarAssignmentsUpdated((data) => this.updateSession({ avatarAssignments: data.avatarAssignments }));

        this.sessionSocketService.onAvatarSelectionJoined((data) => this.updateSession({ id: data.playerId }));

        this.sessionSocketService.onGameSessionStarted(() => {
            this.router.navigate([ROUTES.gameSessionPage]);
        });

        this.sessionSocketService.onPlayerKicked((data) => {
            this.resetSession();
            this.notificationService.displayError({
                title: 'Exclusion de la session',
                message: data.message,
                redirectRoute: ROUTES.homePage,
            });
        });

        this.sessionSocketService.onSessionEnded((data) => {
            this.resetSession();
            this.notificationService.displayError({
                title: 'Session terminée',
                message: data.message,
                redirectRoute: ROUTES.homePage,
            });
        });
    }
}
