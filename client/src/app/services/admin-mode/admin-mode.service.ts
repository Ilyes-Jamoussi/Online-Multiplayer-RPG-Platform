import { Injectable, signal } from '@angular/core';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';

@Injectable({
  providedIn: 'root'
})
export class AdminModeService {
  readonly isAdminModeActivated = signal<boolean>(false);

  constructor(
    private readonly inGameSocketService: InGameSocketService,
    private readonly playerService: PlayerService,
    private readonly sessionService: SessionService
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

  private initListeners(): void {
    this.inGameSocketService.onAdminModeToggled((data: { isAdminModeActive: boolean }) => {
      this.isAdminModeActivated.set(data.isAdminModeActive);
    });
  }
}
