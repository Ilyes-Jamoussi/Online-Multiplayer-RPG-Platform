import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { AvatarSelectionState } from '@app/types/component.types';
import { AvatarAssignment } from '@common/interfaces/session.interface';

@Component({
    selector: 'app-avatar-card',
    imports: [NgClass],
    templateUrl: './avatar-card.component.html',
    styleUrls: ['./avatar-card.component.scss'],
})
export class AvatarCardComponent {
    @Input({ required: true }) assignment: AvatarAssignment;

    constructor(
        private readonly playerService: PlayerService,
        private readonly assetsService: AssetsService,
    ) {}

    get selectionState(): AvatarSelectionState {
        if (!this.assignment.chosenBy) return 'available';
        return this.assignment.chosenBy === this.playerService.id() ? 'mine' : 'taken';
    }

    select(): void {
        if (this.selectionState === 'available') {
            this.playerService.selectAvatar(this.assignment.avatar);
        }
    }

    get avatarImage(): string {
        return this.assetsService.getAvatarStaticImage(this.assignment.avatar);
    }
}
