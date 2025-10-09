import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { DEFAULT_PLAYER } from '@app/constants/player.constants';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Player } from '@common/models/player.interface';

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
    ) {}

    get sessionId(): string {
        return this.sessionService.session().id;
    }

    updatePlayer(partial: Partial<Player>): void {
        this._player.update((player) => ({ ...player, ...partial }));
    }

    setPlayer(player: Player): void {
        this._player.set({ ...player });
    }

    resetPlayer(): void {
        this._player.set({ ...DEFAULT_PLAYER });
    }

    selectAvatar(avatar: Avatar): void {
        this.updatePlayer({ avatar });

        if (this.isAdmin()) {
            this.sessionService.assignAvatar(this.id(), avatar);
        } else {
            this.sessionSocketService.updateAvatarsAssignment({
                sessionId: this.sessionService.id(),
                avatar,
            });
        }
    }
}
