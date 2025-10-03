import { computed, Injectable, Signal, signal } from '@angular/core';
import { BASE_STAT, DEFAULT_PLAYER } from '@app/constants/player.constants';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Player } from '@common/models/player.model';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private readonly _player = signal<Player>({ ...DEFAULT_PLAYER });

    constructor(
        private readonly sessionService: SessionService,
        private readonly sessionSocketService: SessionSocketService,
    ) {}

    get player(): Signal<Player> {
        return this._player.asReadonly();
    }

    get id(): Signal<string> {
        return computed(() => this.player().id);
    }

    get isAdmin(): Signal<boolean> {
        return computed(() => this.player().isAdmin);
    }

    get avatar(): Signal<Avatar | null> {
        return computed(() => this.player().avatar);
    }

    get canCreateCharacter(): Signal<boolean> {
        return computed(() => {
            const player = this.player();
            const hasBonus = player.maxHp > BASE_STAT || player.speed > BASE_STAT;
            return !!player.name && player.avatar !== null && hasBonus;
        });
    }

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
