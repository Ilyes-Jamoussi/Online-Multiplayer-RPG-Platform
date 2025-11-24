import { CommonModule } from '@angular/common';
import { Component, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { TimerService } from '@app/services/timer/timer.service';
import { PlayerStat } from '@common/interfaces/player-stat.interface';

@Component({
    selector: 'app-game-over-overlay',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-over-overlay.component.html',
    styleUrls: ['./game-over-overlay.component.scss'],
})
export class GameOverOverlayComponent implements OnDestroy {
    constructor(
        private readonly inGameService: InGameService,
        private readonly playerService: PlayerService,
        private readonly router: Router,
        private readonly timerCoordinatorService: TimerService,
    ) {
        effect(() => {
            const gameOverData = this.inGameService.gameOverData();
            if (gameOverData) {
                this.timerCoordinatorService.startGameOverTimer(this.router);
            } else {
                this.timerCoordinatorService.stopGameOverTimer();
            }
        });
    }

    get gameOverData() {
        return this.inGameService.gameOverData();
    }

    get gameOverTimeRemaining(): number {
        return this.timerCoordinatorService.gameOverTimeRemaining();
    }

    get isWinner(): boolean {
        return this.gameOverData?.winnerId === this.playerService.id();
    }

    get title(): string {
        return this.isWinner ? 'Tu as gagné la partie !' : `${this.gameOverData?.winnerName} a gagné la partie !`;
    }
    get playerStats(): PlayerStat[] {
        if (!this.gameOverData) return [];

        const players = Object.values(this.inGameService.inGamePlayers());
        return players
            .filter((player) => player.isInGame)
            .map((player) => ({
                name: player.name,
                wins: player.combatWins,
                isWinner: player.id === this.gameOverData?.winnerId,
            }))
            .sort((playerA, playerB) => playerB.wins - playerA.wins);
    }

    ngOnDestroy(): void {
        this.timerCoordinatorService.stopGameOverTimer();
    }

    returnToHome(): void {
        this.timerCoordinatorService.stopGameOverTimer();
        this.inGameService.reset();
        void this.router.navigate([ROUTES.HomePage]);
    }

    viewStatistics(): void {
        this.timerCoordinatorService.stopGameOverTimer();
        void this.router.navigate([ROUTES.StatisticsPage]);
    }
}
