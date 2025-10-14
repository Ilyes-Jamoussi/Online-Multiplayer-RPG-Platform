import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/constants/routes.constants';
import { InGameService } from '@app/services/in-game/in-game.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-game-session-page',
    imports: [UiPageLayoutComponent, CommonModule],
    templateUrl: './game-session-page.component.html',
    styleUrl: './game-session-page.component.scss',
})
export class GameSessionPageComponent implements OnInit, OnDestroy {
    constructor(
        readonly inGameService: InGameService,
        private readonly router: Router,
    ) {}

    get transitionMessage(): string {
        return `Tour ${this.inGameService.turnNumber()} - ${
            this.inGameService.inGamePlayers()[this.inGameService.currentTurn().activePlayerId]?.name ||
            this.inGameService.currentTurn().activePlayerId
        }`;
    }

    get disableStartButton(): boolean {
        return !this.inGameService.isMyTurn() || this.inGameService.isGameStarted();
    }

    ngOnInit(): void {
        this.inGameService.loadInGameSession();
    }

    ngOnDestroy(): void {
        this.inGameService.cleanupAll();
    }

    onStartGame(): void {
        this.inGameService.startGame();
    }

    onBack(): void {
        this.router.navigate([ROUTES.homePage]);
    }
}
