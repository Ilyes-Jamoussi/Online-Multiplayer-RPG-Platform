import { CommonModule } from '@angular/common';
import { Component, OnInit, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewCardComponent } from '@app/components/features/game-preview-card/game-preview-card.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/enums/routes.enum';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerService } from '@app/services/player/player.service';
import { GameTab } from '@app/types/game-tab.types';

@Component({
    selector: 'app-session-creation-page',
    templateUrl: './session-creation-page.component.html',
    styleUrls: ['./session-creation-page.component.scss'],
    standalone: true,
    imports: [CommonModule, GamePreviewCardComponent, UiPageLayoutComponent],
})
export class SessionCreationPageComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly gameStoreService: GameStoreService,
        private readonly sessionService: SessionService,
        private readonly playerService: PlayerService,
    ) {}

    get activeTab(): Signal<GameTab> {
        return this.gameStoreService.activeTab.asReadonly();
    }

    get visibleGames(): Signal<GamePreviewDto[]> {
        switch (this.activeTab()) {
            case 'all':
                return this.gameStoreService.visibleGames;
            case 'classic':
                return this.gameStoreService.classicGames;
            case 'ctf':
                return this.gameStoreService.ctfGames;
        }
    }

    get ctfCount(): number {
        return this.gameStoreService.ctfGames().length;
    }

    get classicCount(): number {
        return this.gameStoreService.classicGames().length;
    }

    get allCount(): number {
        return this.gameStoreService.visibleGames().length;
    }

    ngOnInit(): void {
        this.playerService.setAsAdmin();
        this.gameStoreService.loadGames().subscribe();
    }

    setActiveTab(tab: GameTab): void {
        this.gameStoreService.setActiveTab(tab);
    }

    onStartGame(game: GamePreviewDto): void {
        this.sessionService.initializeSessionWithGame(game.id, game.size, game.mode);
    }

    onBack(): void {
        void this.router.navigate([ROUTES.HomePage]);
    }
}
