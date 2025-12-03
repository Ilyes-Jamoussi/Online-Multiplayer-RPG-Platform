import { Component, OnInit, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewCardComponent } from '@app/components/features/game-preview-card/game-preview-card.component';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/enums/routes.enum';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { NotificationService } from '@app/services/notification/notification.service';

@Component({
    selector: 'app-management-page',
    templateUrl: './management-page.component.html',
    styleUrls: ['./management-page.component.scss'],
    standalone: true,
    imports: [GamePreviewCardComponent, UiPageLayoutComponent, UiButtonComponent],
})
export class ManagementPageComponent implements OnInit {
    get gameDisplays(): Signal<GamePreviewDto[]> {
        return this.gameStoreService.managementGames;
    }

    constructor(
        private readonly router: Router,
        private readonly gameStoreService: GameStoreService,
        private readonly notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.gameStoreService.loadGames().subscribe();
    }

    onCreateNewGame(): void {
        void this.router.navigate([ROUTES.ParametersPage]);
    }

    onEditGame(id: string): void {
        void this.router.navigate([ROUTES.EditorPage, id]);
    }

    onDeleteGame(gameId: string): void {
        this.notificationService.displayConfirmationPopup({
            title: 'Supprimer le jeu',
            message: 'Êtes-vous sûr de vouloir supprimer ce jeu ? Cette action est irréversible.',
            onConfirm: () => {
                this.gameStoreService.deleteGame(gameId).subscribe();
            },
        });
    }

    onToggleVisibility(gameId: string): void {
        this.gameStoreService.toggleGameVisibility(gameId).subscribe();
    }

    onBack(): void {
        void this.router.navigate([ROUTES.HomePage]);
    }
}
