import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';

@Component({
    selector: 'app-flag-transfer-overlay',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './flag-transfer-overlay.component.html',
    styleUrls: ['./flag-transfer-overlay.component.scss'],
})
export class FlagTransferOverlayComponent {
    constructor(
        private readonly inGameService: InGameService,
        private readonly assetsService: AssetsService,
    ) {}

    get pendingRequest() {
        return this.inGameService.pendingFlagTransferRequest();
    }

    get fromPlayerName(): string {
        return this.pendingRequest?.fromPlayerName || '';
    }

    get fromPlayerAvatar(): string {
        if (!this.pendingRequest) return '';
        const player = this.inGameService.getPlayerByPlayerId(this.pendingRequest.fromPlayerId);
        if (!player) return '';
        return this.assetsService.getAvatarAnimatedImage(player.avatar);
    }

    get toPlayerAvatar(): string {
        if (!this.pendingRequest) return '';
        const player = this.inGameService.getPlayerByPlayerId(this.pendingRequest.toPlayerId);
        if (!player) return '';
        return this.assetsService.getAvatarAnimatedImage(player.avatar);
    }

    accept(): void {
        if (!this.pendingRequest) return;
        this.inGameService.respondToFlagTransfer(this.pendingRequest.fromPlayerId, true);
    }

    reject(): void {
        if (!this.pendingRequest) return;
        this.inGameService.respondToFlagTransfer(this.pendingRequest.fromPlayerId, false);
    }
}
