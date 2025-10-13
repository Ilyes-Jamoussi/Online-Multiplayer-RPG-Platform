import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { InGameSession } from '@common/models/session.interface';

@Component({
    selector: 'app-game-session-page',
    imports: [UiPageLayoutComponent, CommonModule],
    templateUrl: './game-session-page.component.html',
    styleUrl: './game-session-page.component.scss',
})
export class GameSessionPageComponent implements OnInit, OnDestroy {
    constructor(
        private readonly playerService: PlayerService,
        private readonly inGameService: InGameService,
    ) {}

    ngOnInit(): void {
        this.inGameService.loadInGameSession();
    }

    ngOnDestroy(): void {
        this.inGameService.cleanupAll();
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

    getIsGameStarted(): boolean {
        return this.inGameService.isGameStarted();
    }

    getDisableStartButton(): boolean {
        return this.getIsGameStarted() || !this.getIsMyTurn();
    }

    getCurrentTurn(): number {
        return this.inGameService.currentTurn();
    }

    getIsTransitioning(): boolean {
        return this.inGameService.isTransitioning();
    }

    getTransitionMessage(): string {
        if (this.getIsMyTurn()) {
            return "C'est à toi de jouer !";
        }
        const activePlayerName = this.getActivePlayerName();
        return `C'est au tour de ${activePlayerName}`;
    }

    onStartTurn(): void {
        this.inGameService.startGame();
    }

    onEndTurn(): void {
        this.inGameService.endTurn();
    }
}
