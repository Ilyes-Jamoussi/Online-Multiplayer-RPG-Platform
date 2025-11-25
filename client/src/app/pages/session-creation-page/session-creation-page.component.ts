import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewCardComponent } from '@app/components/features/game-preview-card/game-preview-card.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/enums/routes.enum';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerService } from '@app/services/player/player.service';

type GameTab = 'classic' | 'ctf';

@Component({
    selector: 'app-session-creation-page',
    templateUrl: './session-creation-page.component.html',
    styleUrls: ['./session-creation-page.component.scss'],
    standalone: true,
    imports: [CommonModule, GamePreviewCardComponent, UiPageLayoutComponent],
})
export class SessionCreationPageComponent implements OnInit {
    readonly activeTab = signal<GameTab>('classic');

    readonly currentGames = computed(() =>
        this.activeTab() === 'classic' ? this.classicGames() : this.ctfGames(),
    );

    constructor(
        private readonly router: Router,
        private readonly gameStoreService: GameStoreService,
        private readonly sessionService: SessionService,
        private readonly playerService: PlayerService,
    ) {}

    get classicGames(): Signal<GamePreviewDto[]> {
        return this.gameStoreService.classicGames;
    }

    get ctfGames(): Signal<GamePreviewDto[]> {
        return this.gameStoreService.ctfGames;
    }

    ngOnInit(): void {
        this.playerService.setAsAdmin();
        this.gameStoreService.loadGames().subscribe();
    }

    setActiveTab(tab: GameTab): void {
        this.activeTab.set(tab);
    }

    onStartGame(game: GamePreviewDto): void {
        this.sessionService.initializeSessionWithGame(game.id, game.size, game.mode);
    }

    onBack(): void {
        void this.router.navigate([ROUTES.HomePage]);
    }
}
