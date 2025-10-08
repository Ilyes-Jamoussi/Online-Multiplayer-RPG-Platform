import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Player } from '@common/models/player.interface';

@Component({
    selector: 'app-waiting-room-actions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './waiting-room-actions.component.html',
    styleUrls: ['./waiting-room-actions.component.scss'],
})
export class WaitingRoomActionsComponent {
    constructor(
        private readonly playerService: PlayerService,
        private readonly sessionService: SessionService,
    ) {}

    get players(): Player[] {
        return this.sessionService.players();
    }

    get isAdmin(): boolean {
        return this.playerService.isAdmin();
    }

    get isLocked(): boolean {
        return this.sessionService.isRoomLocked();
    }

    get canToggleLock(): boolean {
        return this.sessionService.canBeLocked() || this.sessionService.canBeUnlocked();
    }

    get canStartGame(): boolean {
        return this.sessionService.canStartGame();
    }

    toggleLock(): void {
        if (this.sessionService.canBeLocked()) {
            this.sessionService.lock();
        } else if (this.sessionService.canBeUnlocked()) {
            this.sessionService.unlock();
        }
    }

    startGame(): void {
        this.sessionService.startGameSession();
    }
}
