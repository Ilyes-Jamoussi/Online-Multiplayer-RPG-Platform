import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameInfoComponent } from '@app/components/features/game-info/game-info.component';
import { GameMapComponent } from '@app/components/features/game-map/game-map.component';
import { GameTimerComponent } from '@app/components/features/game-timer/game-timer.component';
import { PlayerInfoComponent } from '@app/components/features/player-info/player-info.component';
import { PlayersListComponent } from '@app/components/features/players-list/players-list.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/constants/routes.constants';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { SessionService } from '@app/services/session/session.service';

@Component({
    selector: 'app-game-session-page',
    imports: [
        CommonModule, 
        UiPageLayoutComponent, 
        GameMapComponent, 
        GameInfoComponent, 
        PlayerInfoComponent, 
        PlayersListComponent, 
        GameTimerComponent
    ],
    templateUrl: './game-session-page.component.html',
    styleUrl: './game-session-page.component.scss',
    providers: [GameMapService]
})
export class GameSessionPageComponent implements OnInit, OnDestroy {
    constructor(
        private readonly sessionService: SessionService,
        private readonly gameMapService: GameMapService,
        readonly inGameService: InGameService,
        private readonly router: Router,
    ) {}

    get gameId(): Signal<string> {
        return this.sessionService.gameId;
    }

    get mapSize() {
        return this.gameMapService.size();
    }

    get activePlayer(): string {
        return this.inGameService.activePlayer?.name || 'En attente...';
    }

    get transitionMessage(): string {
        return this.inGameService.turnTransitionMessage;
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

    onEndTurn(): void {
        this.inGameService.endTurn();
    }

    onAbandonGame(): void {
        this.inGameService.abandonGame();
    }

    onBack(): void {
        this.inGameService.cleanupAll();
        this.router.navigate([ROUTES.homePage]);
    }
}
