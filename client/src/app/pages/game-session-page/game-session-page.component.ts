import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { GameInfoComponent } from '@app/components/features/game-info/game-info.component';
import { GameMapComponent } from '@app/components/features/game-map/game-map.component';
import { PlayerInfoComponent } from '@app/components/features/player-info/player-info.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';

@Component({
  selector: 'app-game-session-page',
  imports: [CommonModule, UiPageLayoutComponent, GameMapComponent, GameInfoComponent, PlayerInfoComponent],
  templateUrl: './game-session-page.component.html',
  styleUrl: './game-session-page.component.scss',
  providers: [GameMapService]
})
export class GameSessionPageComponent {
  constructor(
    private readonly sessionService: SessionService,
    private readonly playerService: PlayerService,
    private readonly gameMapService: GameMapService
  ) {}

  get gameId(): Signal<string> {
    return this.sessionService.gameId;
  }

  get mapSize() {
    return this.gameMapService.size();
  }

  // TODO: Implémenter la logique du joueur actif
  get activePlayer(): string {
    return 'En attente...';
  }

  onBack(): void {
    this.sessionService.leaveSession();
    this.playerService.resetPlayer();
  }
}
