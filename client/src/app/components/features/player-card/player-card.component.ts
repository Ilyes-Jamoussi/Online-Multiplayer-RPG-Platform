import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { Player } from '@common/models/player.model';

@Component({
    selector: 'app-player-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './player-card.component.html',
    styleUrl: './player-card.component.scss',
})
export class PlayerCardComponent {
    @Input() player!: Player;

    constructor(
        private readonly playerService: PlayerService,
        private readonly assetsService: AssetsService,
    ) {}

    get isMe(): boolean {
        return this.player.id === this.playerService.id();
    }

    get isAdmin(): boolean {
        return this.player.isAdmin;
    }

    get cardClasses(): { [key: string]: boolean } {
        return {
            me: this.isMe,
            admin: this.isAdmin,
        };
    }

    get showKickButton(): boolean {
        return this.playerService.isAdmin() && !this.isAdmin;
    }

    kickPlayer() {
        // this.sessionService.kickPlayer(this.player.id);
    }

    getAvatarImage(): string {
        return this.assetsService.getAvatarStaticImage(this.player.avatar);
    }
}
