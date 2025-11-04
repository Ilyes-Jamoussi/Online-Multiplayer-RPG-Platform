import { Injectable, signal } from '@angular/core';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';

@Injectable({
    providedIn: 'root',
})
export class AdminModeService {
    readonly isAdminModeActivated = signal<boolean>(false);

    constructor(
        private readonly inGameSocketService: InGameSocketService,
        private readonly playerService: PlayerService,
        private readonly sessionService: SessionService,
        private readonly inGameService: InGameService,
    ) {
        this.initListeners();
    }

    toggleAdminMode(): void {
        if (this.playerService.isAdmin()) {
            this.inGameSocketService.toggleAdminMode(this.sessionService.id());
        }
    }

    disableAdminModeOnAbandon(): void {
        if (this.isAdminModeActivated() && this.playerService.isAdmin()) {
            this.inGameSocketService.toggleAdminMode(this.sessionService.id());
        }
    }

    teleportPlayer(x: number, y: number): void {
        if (!this.inGameService.isMyTurn() || !this.inGameService.isGameStarted() || !this.isAdminModeActivated()) return;
        this.inGameSocketService.playerTeleport({ sessionId: this.sessionService.id(), x, y });
    }

    private initListeners(): void {
        this.inGameSocketService.onAdminModeToggled((data) => {
            this.isAdminModeActivated.set(data.isAdminModeActive);
        });
    }
}
