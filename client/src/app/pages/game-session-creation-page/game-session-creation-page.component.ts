import { CommonModule } from '@angular/common';
import { Component, OnInit, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
import { ROUTES } from '@app/constants/routes.constants';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { UiPageLayoutComponent } from '@app/shared/ui/components/page-layout/page-layout.component';
import { GamePreviewCardComponent } from '@app/shared/components/game-preview-card/game-preview-card.component';

@Component({
    selector: 'app-game-session-creation-page',
    templateUrl: './game-session-creation-page.component.html',
    styleUrls: ['./game-session-creation-page.component.scss'],
    standalone: true,
    imports: [CommonModule, GamePreviewCardComponent, UiPageLayoutComponent],
})
export class GameSessionCreationPageComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly gameStoreService: GameStoreService,
    ) {}

    get visibleGameDisplays(): Signal<GamePreviewDto[]> {
        return this.gameStoreService.visibleGames;
    }

    ngOnInit(): void {
        this.gameStoreService.loadGames().subscribe();
    }

    onBackClick(): void {
        this.router.navigate([ROUTES.home]);
    }

    onStartGame(): void {
        this.router.navigate([ROUTES.characterCreation]);
    }
}
