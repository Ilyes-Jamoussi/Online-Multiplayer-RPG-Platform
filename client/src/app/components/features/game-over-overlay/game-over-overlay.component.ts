import { CommonModule } from '@angular/common';
import { Component, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { TimerService } from '@app/services/timer/timer.service';
import { GameMode } from '@common/enums/game-mode.enum';
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

    get isCTFMode(): boolean {
        return this.inGameService.mode() === GameMode.CTF;
    }

    get winnerTeamNumber(): number | null {
        if (!this.gameOverData || !this.isCTFMode) return null;
        const winner = this.inGameService.getPlayerByPlayerId(this.gameOverData.winnerId);
        return winner?.teamNumber ?? null;
    }

    get myTeamNumber(): number | null {
        if (!this.isCTFMode) return null;
        const player = this.inGameService.getPlayerByPlayerId(this.playerService.id());
        return player?.teamNumber ?? null;
    }

    get winnerTeamPlayers(): string[] {
        if (!this.winnerTeamNumber) return [];
        const session = this.inGameService.inGameSession();
        const team = session.teams[this.winnerTeamNumber];
        if (!team) return [];
        return team.playerIds
            .map((playerId) => {
                const player = session.inGamePlayers[playerId];
                return player?.name || '';
            })
            .filter((name) => name !== '');
    }

    get title(): string {
        if (this.isCTFMode && this.winnerTeamNumber) {
            if (this.myTeamNumber === this.winnerTeamNumber) {
                return 'Votre équipe a gagné la partie !';
            } else {
                return `L'équipe ${this.winnerTeamNumber} a gagné la partie !`;
            }
        }
        return this.isWinner ? 'Vous avez gagné la partie !' : `${this.gameOverData?.winnerName} a gagné la partie !`;
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
