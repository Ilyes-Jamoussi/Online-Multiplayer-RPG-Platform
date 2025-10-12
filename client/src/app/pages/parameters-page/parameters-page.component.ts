import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiIconComponent } from '@app/components/ui/icon/icon.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/constants/routes.constants';
import { GameModeOption, MapSizeOption } from '@app/interfaces/game-parameters.interface';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MAP_SIZE_TO_MAX_PLAYERS, MapSize } from '@common/enums/map-size.enum';

@Component({
    selector: 'app-parameters-page',
    standalone: true,
    imports: [CommonModule, FormsModule, UiButtonComponent, UiIconComponent, UiPageLayoutComponent],
    templateUrl: './parameters-page.component.html',
    styleUrls: ['./parameters-page.component.scss'],
})
export class ParametersPageComponent {
    selectedMapSize: MapSize = MapSize.MEDIUM;
    selectedGameMode: GameMode = GameMode.CLASSIC;

    constructor(
        private readonly router: Router,
        private readonly notificationService: NotificationService,
        private readonly gameStoreService: GameStoreService,
    ) {}

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
                    this.router.navigate([ROUTES.editorPage, gamePreview.id]);
                },
                error: (err) => {
                    this.notificationService.displayError({
                        title: 'Erreur lors de la création de la partie',
                        message: err?.error?.message ?? 'Une erreur est survenue',
                    });
                },
            });
    }
}
