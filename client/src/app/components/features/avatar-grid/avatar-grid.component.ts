import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AvatarCardComponent } from '@app/components/features/avatar-card/avatar-card.component';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';

import { Avatar } from '@common/enums/avatar.enum';
import { AvatarAssignment } from '@common/models/session.model';


@Component({
    selector: 'app-avatar-grid',
    imports: [CommonModule, AvatarCardComponent],
    templateUrl: './avatar-grid.component.html',
    styleUrls: ['./avatar-grid.component.scss'],
})
export class AvatarGridComponent {
    constructor(
        private readonly sessionService: SessionService,
        private readonly playerService: PlayerService,
        private readonly assetsService: AssetsService
    ) {}

    get assignments(): AvatarAssignment[] {
        return this.sessionService.avatarAssignments();
    }

    get selectedAvatar(): Avatar | null {
        return this.playerService.avatar();
    }

    get animatedAvatar(): string | null {
        return this.assetsService.getAvatarAnimatedImage(this.selectedAvatar);
    }
}
