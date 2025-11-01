import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { ROUTES } from '@common/enums/routes.enum';

@Component({
    selector: 'app-game-over-overlay',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-over-overlay.component.html',
    styleUrls: ['./game-over-overlay.component.scss']
})
export class GameOverOverlayComponent {
    constructor(
        private readonly inGameService: InGameService,
        private readonly playerService: PlayerService,
        private readonly router: Router
    ) {}

    get gameOverData() {
        return this.inGameService.gameOverData();
    }

    get isWinner(): boolean {
        return this.gameOverData?.winnerId === this.playerService.id();
    }

    get title(): string {
        return this.isWinner ? 'Tu as gagné la partie !' : `${this.gameOverData?.winnerName} a gagné la partie !`;
    }

    get playerStats(): { name: string; wins: number; isWinner: boolean }[] {
        if (!this.gameOverData) return [];

        const players = Object.values(this.inGameService.inGamePlayers());
        return players
            .filter(p => p.isInGame)
            .map(p => ({
                name: p.name,
                wins: p.combatWins,
                isWinner: p.id === this.gameOverData?.winnerId
            }))
            .sort((a, b) => b.wins - a.wins);
    }

    returnToHome(): void {
        this.inGameService.reset();
        this.router.navigate([ROUTES.HomePage]);
    }
}

