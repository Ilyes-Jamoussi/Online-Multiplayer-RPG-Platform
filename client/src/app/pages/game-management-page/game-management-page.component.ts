import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
import { ROUTES } from '@app/constants/routes.constants';
import { GameStoreService } from '@app/services/game/game-store/game-store.service';
import { GamePreviewCardComponent } from '@app/shared/components/game-preview-card/game-preview-card.component';

@Component({
    selector: 'app-game-management-page',
    templateUrl: './game-management-page.component.html',
    styleUrls: ['./game-management-page.component.scss'],
    standalone: true,
    imports: [CommonModule, GamePreviewCardComponent],
})
export class GameManagementPageComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly gameStoreService = inject(GameStoreService);

    get gameDisplays(): Signal<GamePreviewDto[]> {
        return this.gameStoreService.gameDisplays;
    }

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
