import { computed, Injectable, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTES } from '@common/enums/routes.enum';
import { DEFAULT_SESSION, MIN_SESSION_PLAYERS } from '@app/constants/session.constants';
import { CreateSessionDto } from '@app/dto/create-session-dto';
import { JoinSessionDto } from '@app/dto/join-session-dto';
import { SessionPreviewDto } from '@app/dto/session-preview-dto';
import { NotificationService } from '@app/services/notification/notification.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { Avatar } from '@common/enums/avatar.enum';
import { MAP_SIZE_TO_MAX_PLAYERS, MapSize } from '@common/enums/map-size.enum';
import { Player } from '@common/models/player.interface';
import { AvatarAssignment, WaitingRoomSession } from '@common/models/session.interface';

@Injectable({ providedIn: 'root' })
export class SessionService {
    private readonly _session = signal<WaitingRoomSession>({ ...DEFAULT_SESSION });
    private readonly _availableSessions = signal<SessionPreviewDto[]>([]);

    readonly session = this._session.asReadonly();
    readonly availableSessions = this._availableSessions.asReadonly();
    readonly id: Signal<string> = computed(() => this.session().id);
    readonly players: Signal<Player[]> = computed(() => this.session().players);
    readonly avatarAssignments: Signal<AvatarAssignment[]> = computed(() => this.session().avatarAssignments);
    readonly gameId: Signal<string> = computed(() => this.session().gameId);
    readonly maxPlayers: Signal<number> = computed(() => this.session().maxPlayers);
    readonly isRoomLocked: Signal<boolean> = computed(() => this.session().isRoomLocked);

    constructor(
        private readonly sessionSocketService: SessionSocketService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {
        this.initListeners();
    }

    updateSession(partial: Partial<WaitingRoomSession>): void {
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

    updateAvatarAssignment(playerId: string, avatar: Avatar, isAdmin: boolean): void {
        if (isAdmin) this.assignAvatar(playerId, avatar);
        else this.sessionSocketService.updateAvatarsAssignment({ sessionId: this.id(), avatar });
    }

    kickPlayer(playerId: string): void {
        this.sessionSocketService.kickPlayer({ playerId });
    }

    leaveSession(): void {
        this.resetSession();
        void this.router.navigate([ROUTES.HomePage]);
        this.sessionSocketService.leaveSession();
    }

    initializeSessionWithGame(gameId: string, mapSize: MapSize): void {
        const maxPlayers = MAP_SIZE_TO_MAX_PLAYERS[mapSize];
        this.updateSession({ id: Date.now().toString(), gameId, maxPlayers });
        void this.router.navigate([ROUTES.CharacterCreationPage]);
    }

    createSession(player: Player): void {
        const session = this.session();
        const dto: CreateSessionDto = {
            gameId: session.gameId,
            maxPlayers: session.maxPlayers,
            player,
        };
        this.sessionSocketService.createSession(dto);
    }

    joinSession(player: Player): void {
        const sessionId = this.id();
        const dto: JoinSessionDto = {
            sessionId,
            player,
        };
        this.sessionSocketService.joinSession(dto);
    }

    startGameSession(): void {
        this.sessionSocketService.startGameSession();
    }

    joinAvatarSelection(sessionId: string): void {
        this.sessionSocketService.joinAvatarSelection({ sessionId });
    }

    leaveAvatarSelection(): void {
        this.sessionSocketService.leaveAvatarSelection({ sessionId: this.id() });
    }

    loadAvailableSessions(): void {
        this.sessionSocketService.loadAvailableSessions();
    }

    handleSessionJoined(data: { gameId: string; maxPlayers: number }): void {
        this.updateSession({ gameId: data.gameId, maxPlayers: data.maxPlayers });
        void this.router.navigate([ROUTES.WaitingRoomPage]);
    }

    private assignAvatar(playerId: string, avatar: Avatar): void {
        const updated = this._session().avatarAssignments.map((assignment) => {
            const isOldChoice = assignment.chosenBy === playerId;
            const isNewChoice = assignment.avatar === avatar;

            if (isOldChoice) return { ...assignment, chosenBy: null };
            if (isNewChoice) return { ...assignment, chosenBy: playerId };
            return assignment;
        });

        this.updateSession({ avatarAssignments: updated });
    }

    private initListeners(): void {
        this.sessionSocketService.onAvatarAssignmentsUpdated((data) => this.updateSession({ avatarAssignments: data.avatarAssignments }));

        this.sessionSocketService.onSessionPlayersUpdated((data) => this.updateSession({ players: data.players as Player[] }));

        this.sessionSocketService.onGameSessionStarted(() => {
            void this.router.navigate([ROUTES.GameSessionPage]);
        });

        this.sessionSocketService.onSessionJoined((data) => {
            this.updateSession({ gameId: data.gameId, maxPlayers: data.maxPlayers });
            void this.router.navigate([ROUTES.WaitingRoomPage]);
        });

        this.sessionSocketService.onSessionCreatedError((error) => {
            this.notificationService.displayError({ 
                title: 'Erreur de création', 
                message: error,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.sessionSocketService.onSessionJoinError((message) => {
            this.notificationService.displayError({ 
                title: 'Erreur', 
                message,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.sessionSocketService.onAvatarSelectionJoinError((message) => {
            this.notificationService.displayError({ 
                title: 'Erreur de connexion', 
                message,
            });
        });

        this.sessionSocketService.onAvatarSelectionJoined((data) => {
            this.updateSession({ id: data.sessionId });
            void this.router.navigate([ROUTES.CharacterCreationPage]);
        });

        this.sessionSocketService.onAvailableSessionsUpdated((data) => {
            this._availableSessions.set(data.sessions);
        });

        this.sessionSocketService.onSessionAutoLocked(() => {
            this.updateSession({ isRoomLocked: true });
        });

        this.sessionSocketService.onStartGameSessionError((msg) => {
            this.notificationService.displayError({ 
                title: 'Impossible de démarrer le jeu', 
                message: msg,
            });
        });
    }
}
