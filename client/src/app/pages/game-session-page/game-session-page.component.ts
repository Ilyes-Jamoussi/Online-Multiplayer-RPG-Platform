import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { GameMapComponent } from '@app/components/features/game-map/game-map.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';

@Component({
  selector: 'app-game-session-page',
  imports: [CommonModule, UiPageLayoutComponent, GameMapComponent],
  templateUrl: './game-session-page.component.html',
  styleUrl: './game-session-page.component.scss'
})
export class GameSessionPageComponent {
  constructor(
    private readonly sessionService: SessionService,
    private readonly playerService: PlayerService
  ) {}

  get gameId(): Signal<string> {
    return this.sessionService.gameId;
  }

  onBack(): void {
    this.sessionService.leaveSession();
    this.playerService.resetPlayer();
  }
}
