import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
import { GameHttpService } from '@app/services/game/game-http/game-http.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { UiCardComponent } from '@app/shared/ui/components/card/card.component';
import { UiSpinnerComponent } from '@app/shared/ui/components/spinner/spinner.component';

@Component({
    selector: 'app-create-game-page',
    standalone: true,
    imports: [
        CommonModule,
        UiCardComponent,
        UiButtonComponent,
        UiSpinnerComponent,
    ],
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent implements OnInit {
    games: GamePreviewDto[] = [];
    loading = true;

    constructor(
        private readonly gameHttpService: GameHttpService,
        private readonly router: Router,
        private readonly notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.loadGames();
    }

    private loadGames(): void {
        this.gameHttpService.getGamesDisplay().subscribe({
            next: (games: GamePreviewDto[]) => {
                this.games = games.filter((game: GamePreviewDto) => game.visibility);
                this.loading = false;
            },
            error: () => {
                this.notificationService.displayError({
                    title: 'Erreur de chargement',
                    message: 'Impossible de charger les jeux. Veuillez réessayer.'
                });
                this.loading = false;
            },
        });
    }

    createGame(game: GamePreviewDto): void {
        // Navigation directe sans notification
        this.router.navigate(['/character-creation'], {
            queryParams: { gameId: game.id },
        });
    }

    goToAdmin(): void {
        this.router.navigate(['/game-management']);
    }

    goToHome(): void {
        this.router.navigate(['/home']);
    }

    getModeLabel(mode: GamePreviewDto.ModeEnum): string {
        switch (mode) {
            case 'classic':
                return 'Classique';
            case 'capture-the-flag':
                return 'Capture du drapeau';
            default:
                return mode;
        }
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }
}
