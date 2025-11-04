import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Player } from '@common/interfaces/player.interface';

@Component({
    selector: 'app-player-card',
    standalone: true,
    imports: [NgClass],
    templateUrl: './player-card.component.html',
    styleUrl: './player-card.component.scss',
})
export class PlayerCardComponent {
    @Input({ required: true }) player: Player;

    constructor(
        private readonly playerService: PlayerService,
        private readonly assetsService: AssetsService,
        private readonly sessionService: SessionService,
    ) {}

    get isMe(): boolean {
        return this.player.id === this.playerService.id();
    }

    get isAdmin(): boolean {
        return this.player.isAdmin;
    }
    // todo: create interface
    get cardClasses(): { [key: string]: boolean } {
        return {
            'is-me': this.isMe,
            'admin': this.isAdmin,
        };
    }

    get showKickButton(): boolean {
        return this.playerService.isAdmin() && !this.isAdmin;
    }

    kickPlayer(): void {
        this.sessionService.kickPlayer(this.player.id);
    }

    get avatarImage(): string {
        return this.assetsService.getAvatarStaticImage(this.player.avatar);
    }
}
