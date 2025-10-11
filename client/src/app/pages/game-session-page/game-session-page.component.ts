import { Component } from '@angular/core';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { PlayerService } from '@app/services/player/player.service';

@Component({
  selector: 'app-game-session-page',
  imports: [UiPageLayoutComponent],
  templateUrl: './game-session-page.component.html',
  styleUrl: './game-session-page.component.scss'
})
export class GameSessionPageComponent {
  constructor(
    private readonly playerService: PlayerService,
  ) {}

  onBack(): void {
    this.playerService.leaveSession();
  }
}
