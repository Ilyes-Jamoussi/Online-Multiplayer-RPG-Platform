import { CommonModule } from '@angular/common';
import { Component, OnInit, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewDto } from '@app/dto/gamePreviewDto';
import { ROUTES } from '@app/constants/routes.constants';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { GamePreviewCardComponent } from '@app/shared/components/game-preview-card/game-preview-card.component';
import { UiPageLayoutComponent } from '@app/shared/ui/components/page-layout/page-layout.component';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';

@Component({
    selector: 'app-game-management-page',
    templateUrl: './game-management-page.component.html',
    styleUrls: ['./game-management-page.component.scss'],
    standalone: true,
    imports: [CommonModule, GamePreviewCardComponent, UiPageLayoutComponent, UiButtonComponent],
})
export class GameManagementPageComponent implements OnInit {
    get gameDisplays(): Signal<GamePreviewDto[]> {
        return this.gameStoreService.managementGames;
    }

    constructor(
        private readonly router: Router,
        private readonly gameStoreService: GameStoreService,
    ) {}

    ngOnInit(): void {
        this.gameStoreService.loadGames().subscribe();
    }

    onCreateNewGame(): void {
        this.router.navigate([ROUTES.gameParameters]);
    }

    onEditGame(id: string): void {
        this.router.navigate([ROUTES.gameEditor + '/' + id]);
    }

    onDeleteGame(gameId: string): void {
        this.gameStoreService.deleteGame(gameId).subscribe();
    }

    onToggleVisibility(gameId: string): void {
        this.gameStoreService.toggleGameVisibility(gameId).subscribe();
    }

    goBack(): void {
        this.router.navigate([ROUTES.home]);
    }
}
