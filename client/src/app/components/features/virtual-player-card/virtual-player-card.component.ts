import { Component, Input } from '@angular/core';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';

@Component({
    selector: 'app-virtual-player-card',
    standalone: true,
    templateUrl: './virtual-player-card.component.html',
    styleUrl: './virtual-player-card.component.scss',
})
export class VirtualPlayerCardComponent {
    @Input({ required: true }) player: Player;

    constructor(
        private readonly assetsService: AssetsService,
        private readonly playerService: PlayerService,
        private readonly sessionService: SessionService,
    ) {}

    get avatarImage(): string {
        return this.assetsService.getAvatarStaticImage(this.player.avatar);
    }

    get showRemoveButton(): boolean {
        return this.playerService.isAdmin();
    }

    removeVirtualPlayer(): void {
        this.sessionService.kickPlayer(this.player.id);
    }

    getTypeIcon(): string {
        return this.player.virtualPlayerType === VirtualPlayerType.Offensive ? 'local_fire_department' : 'security';
    }

    getTypeLabel(): string {
        return this.player.virtualPlayerType === VirtualPlayerType.Offensive ? 'Offensive' : 'Defensive';
    }
}
