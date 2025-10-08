import { Component } from '@angular/core';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';

@Component({
  selector: 'app-game-session-page',
  imports: [UiPageLayoutComponent],
  templateUrl: './game-session-page.component.html',
  styleUrl: './game-session-page.component.scss'
})
export class GameSessionPageComponent {
  constructor(
    private readonly sessionService: SessionService,
    private readonly playerService: PlayerService
  ) {}

  onBack(): void {
    this.sessionService.leaveSession();
    this.playerService.resetPlayer();
  }
}
