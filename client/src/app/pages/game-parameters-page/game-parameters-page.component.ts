import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { GameModeOption, MapSizeOption } from '@app/interfaces/game-parameters.interface';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { UiPageLayoutComponent } from '@app/shared/ui/components/page-layout/page-layout.component';
import { GameMode } from '@common/enums/game-mode.enum';
import { MAP_SIZE_TO_MAX_PLAYERS, MapSize } from '@common/enums/map-size.enum';
import { DEFAULT_DRAFT_GAME_NAME, DEFAULT_DRAFT_GAME_DESCRIPTION } from '@common/constants/game.constants';

@Component({
    selector: 'app-game-parameters-page',
    standalone: true,
    imports: [CommonModule, FormsModule, UiButtonComponent, UiPageLayoutComponent],
    templateUrl: './game-parameters-page.component.html',
    styleUrls: ['./game-parameters-page.component.scss'],
})
export class GameParametersPageComponent {
    private readonly gameStoreService = inject(GameStoreService);

    selectedMapSize: MapSize = MapSize.MEDIUM;
    selectedGameMode: GameMode = GameMode.CLASSIC;

    readonly mapSizeOptions: MapSizeOption[] = [
        {
            value: MapSize.SMALL,
            label: `Petite (${MapSize.SMALL}x${MapSize.SMALL})`,
            maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.SMALL],
        },
        {
            value: MapSize.MEDIUM,
            label: `Moyenne (${MapSize.MEDIUM}x${MapSize.MEDIUM})`,
            maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.MEDIUM],
        },
        {
            value: MapSize.LARGE,
            label: `Grande (${MapSize.LARGE}x${MapSize.LARGE})`,
            maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.LARGE],
        },
    ];

    readonly gameModeOptions: GameModeOption[] = [
        {
            value: GameMode.CLASSIC,
            label: 'Classique',
            description: 'Mode de jeu standard',
        },
        {
            value: GameMode.CTF,
            label: 'Capture du Drapeau',
            description: 'Capturez le drapeau ennemi',
        },
    ];

    constructor(
        private readonly router: Router,
        private readonly location: Location,
        private readonly notificationService: NotificationService,
    ) {}

    onCreate(): void {
        this.gameStoreService
            .createGame({
                size: this.selectedMapSize,
                mode: this.selectedGameMode,
                name: DEFAULT_DRAFT_GAME_NAME,
                description: DEFAULT_DRAFT_GAME_DESCRIPTION,
                visibility: false,
            })
            .subscribe({
                next: (gamePreview) => {
                    this.router.navigate([ROUTES.gameEditor, gamePreview.id]);
                },
                error: (err) => {
                    this.notificationService.displayError({
                        title: 'Erreur lors de la création de la partie',
                        message: err?.error?.message ?? 'Une erreur est survenue',
                    });
                },
            });
    }

    onBack(): void {
        this.location.back();
    }
}
