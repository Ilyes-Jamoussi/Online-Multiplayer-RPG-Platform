import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiIconComponent } from '@app/components/ui/icon/icon.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/enums/routes.enum';
import { GameModeOption, MapSizeOption } from '@app/interfaces/game-parameters.interface';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { MAP_SIZE_TO_MAX_PLAYERS } from '@app/constants/map-size.constants';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

@Component({
    selector: 'app-parameters-page',
    standalone: true,
    imports: [FormsModule, UiButtonComponent, UiIconComponent, UiPageLayoutComponent],
    templateUrl: './parameters-page.component.html',
    styleUrls: ['./parameters-page.component.scss'],
})
export class ParametersPageComponent {
    selectedMapSize: MapSize = MapSize.MEDIUM;
    selectedGameMode: GameMode = GameMode.CLASSIC;

    constructor(
        private readonly router: Router,
        private readonly notificationCoordinatorService: NotificationService,
        private readonly gameStoreService: GameStoreService,
    ) {}

    readonly mapSizeOptions: MapSizeOption[] = [
        {
            value: MapSize.SMALL,
            label: `Petit (${MapSize.SMALL}x${MapSize.SMALL})`,
            maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.SMALL],
        },
        {
            value: MapSize.MEDIUM,
            label: `Moyen (${MapSize.MEDIUM}x${MapSize.MEDIUM})`,
            maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.MEDIUM],
        },
        {
            value: MapSize.LARGE,
            label: `Grand (${MapSize.LARGE}x${MapSize.LARGE})`,
            maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.LARGE],
        },
    ];

    readonly gameModeOptions: GameModeOption[] = [
        {
            value: GameMode.CLASSIC,
            label: 'Classique',
            description: 'Gagnez 3 combats pour remporter la partie',
            icon: '⚔️',
        },
        {
            value: GameMode.CTF,
            label: 'Capture du Drapeau',
            description: 'Capturez le drapeau et ramenez-le à votre point de départ pour gagner en équipe',
            icon: '🚩',
        },
    ];

    onCreate(): void {
        this.gameStoreService
            .createGame({
                size: this.selectedMapSize,
                mode: this.selectedGameMode,
                name: '',
                description: '',
                visibility: false,
            })
            .subscribe({
                next: (gamePreview) => {
                    void this.router.navigate([ROUTES.EditorPage, gamePreview.id]);
                },
                error: (err) => {
                    this.notificationCoordinatorService.displayErrorPopup({
                        title: 'Erreur lors de la création de la partie',
                        message: err?.error?.message ?? 'Une erreur est survenue',
                    });
                },
            });
    }
}
