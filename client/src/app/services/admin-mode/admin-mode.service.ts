import { Injectable, signal } from '@angular/core';
import { InGameSocketService } from '../in-game-socket/in-game-socket.service';
import { SessionService } from '../session/session.service';
import { PlayerService } from '../player/player.service';

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
    if(this.playerService.isAdmin()) {
      this.inGameSocketService.toggleAdminMode(this.sessionService.id());
    }
  }

  disableAdminModeOnAbandon(): void {
    if(this.isAdminModeActivated() && this.playerService.isAdmin()) {
      this.inGameSocketService.toggleAdminMode(this.sessionService.id());
    }
  }

  private initListeners(): void {
    this.inGameSocketService.onAdminModeToggled(() => {
      this.isAdminModeActivated.set(!this.isAdminModeActivated());
    });
  }
}
