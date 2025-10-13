import { Component, OnInit } from '@angular/core';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { InGameSession } from '@common/models/session.interface';

@Component({
    selector: 'app-game-session-page',
    imports: [UiPageLayoutComponent],
    templateUrl: './game-session-page.component.html',
    styleUrl: './game-session-page.component.scss',
})
export class GameSessionPageComponent implements OnInit {
    constructor(
        private readonly playerService: PlayerService,
        private readonly inGameService: InGameService,
    ) {}

    ngOnInit(): void {
        this.inGameService.loadInGameSession();
    }

    get inGameSession(): InGameSession {
        return this.inGameService.inGameSession();
    }

    onBack(): void {
        this.playerService.leaveSession();
    }

    getPlayerNames(): string {
        return this.inGameSession.players.map((player) => player.name).join(', ');
    }

    getStartPointsString(): string {
        return this.inGameSession.startPoints.map((startPoint) => `${startPoint.x}, ${startPoint.y}`).join(' ET ');
    }

    getActivePlayerName(): string {
        const activePlayer = this.inGameSession.players.find((player) => player.id === this.inGameService.activePlayerId());
        return activePlayer?.name || '';
    }

    getTimeRemaining(): string {
        return this.inGameService.isTimerActive() ? this.inGameService.timeRemaining().toString() : 'inactive';
    }

    getIsMyTurn(): boolean {
        return this.inGameService.isMyTurn;
    }

    onStartTurn(): void {
        this.inGameService.startTurn();
    }
}
