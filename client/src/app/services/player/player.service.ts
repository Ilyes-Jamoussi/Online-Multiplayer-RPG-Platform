import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_PLAYER } from '@app/constants/player.constants';
import { ROUTES } from '@app/constants/routes.constants';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Player } from '@common/models/player.interface';
import { NotificationService } from '@app/services/notification/notification.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private readonly _player: WritableSignal<Player> = signal<Player>({ ...DEFAULT_PLAYER });

    readonly player: Signal<Player> = this._player.asReadonly();
    readonly id: Signal<string> = computed(() => this.player().id);
    readonly isAdmin: Signal<boolean> = computed(() => this.player().isAdmin);
    readonly avatar: Signal<Avatar | null> = computed(() => this.player().avatar);

    constructor(
        private readonly sessionService: SessionService,
        private readonly sessionSocketService: SessionSocketService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {
        this.initListeners();
    }

    updatePlayer(partial: Partial<Player>): void {
        this._player.update((player) => ({ ...player, ...partial }));
    }

    resetPlayer(): void {
        this._player.set({ ...DEFAULT_PLAYER });
    }

    selectAvatar(avatar: Avatar): void {
        this.updatePlayer({ avatar });
        this.sessionService.updateAvatarAssignment(this.id(), avatar, this.isAdmin());
    }

    createSession(): void {
        this.sessionService.createSession(this.player());
    }

    joinAvatarSelection(sessionId: string): void {
        this.sessionService.joinAvatarSelection(sessionId);
    }

    joinSession(): void {
        this.sessionService.joinSession(this.player());
    }

    leaveSession(): void {
        this.resetPlayer();
        this.sessionService.leaveSession();
    }

    leaveAvatarSelection(): void {
        if (!this.isAdmin()) {
            this.sessionService.leaveAvatarSelection();
        }

        this.resetPlayer();
        this.sessionService.resetSession();
    }

    private initListeners(): void {
        this.sessionSocketService.onSessionCreated((data) => {
            this.updatePlayer({ id: data.playerId });
            this.sessionService.updateSession({ id: data.sessionId });
            this.router.navigate([ROUTES.waitingRoomPage]);
        });

        this.sessionSocketService.onSessionEnded((data) => {
            this.resetPlayer();
            this.sessionService.resetSession();
            this.notificationService.displayError({
                title: 'Session terminée',
                message: data.message,
                redirectRoute: ROUTES.homePage,
            });
        });

        this.sessionSocketService.onAvatarSelectionJoined((data) => {
            this.updatePlayer({ id: data.playerId, isAdmin: false });
            this.sessionService.updateSession({ id: data.sessionId });
            this.router.navigate([ROUTES.characterCreationPage]);
        });
    }
}
