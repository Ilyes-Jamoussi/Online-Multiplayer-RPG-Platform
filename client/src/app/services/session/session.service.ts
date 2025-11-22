import { computed, Injectable, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MAP_SIZE_TO_MAX_PLAYERS } from '@app/constants/map-size.constants';
import { DEFAULT_SESSION, MIN_SESSION_PLAYERS } from '@app/constants/session.constants';
import { CreateSessionDto } from '@app/dto/create-session-dto';
import { JoinSessionDto } from '@app/dto/join-session-dto';
import { SessionJoinedDto } from '@app/dto/session-joined-dto';
import { SessionPreviewDto } from '@app/dto/session-preview-dto';
import { ROUTES } from '@app/enums/routes.enum';
import { ChatSocketService } from '@app/services/chat-socket/chat-socket.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { Avatar } from '@common/enums/avatar.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { AvatarAssignment, WaitingRoomSession } from '@common/interfaces/session.interface';

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
    readonly chatId: Signal<string> = computed(() => this.session().chatId);

    constructor(
        private readonly sessionSocketService: SessionSocketService,
        private readonly router: Router,
        private readonly chatSocketService: ChatSocketService,
    ) {
        this.initListeners();
    }

    updateSession(partial: Partial<WaitingRoomSession>): void {
        this._session.update((session) => ({ ...session, ...partial }));
    }

    reset(): void {
        const currentChatId = this.chatId();
        if (currentChatId) {
            this.chatSocketService.leaveChatRoom({ chatId: currentChatId });
        }
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

    addVirtualPlayer(virtualPlayerType: VirtualPlayerType): void {
        const sessionId = this.id();
        this.sessionSocketService.addVirtualPlayer({ sessionId, virtualPlayerType });
    }

    leaveSession(): void {
        this.reset();
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

    handleSessionJoined(data: SessionJoinedDto): void {
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
            this.updateSession({ gameId: data.gameId, maxPlayers: data.maxPlayers, chatId: data.chatId });
            void this.router.navigate([ROUTES.WaitingRoomPage]);
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
    }
}
