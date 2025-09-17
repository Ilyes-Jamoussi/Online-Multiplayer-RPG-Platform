import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { GameModeOption, MapSizeOption } from '@app/interfaces/game-parameters.interface';
import { GameHttpService } from '@app/services/game/game-http/game-http.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MAP_SIZE_TO_MAX_PLAYERS, MapSize } from '@common/enums/map-size.enum';

@Component({
    selector: 'app-game-parameters-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './game-parameters-page.component.html',
    styleUrls: ['./game-parameters-page.component.scss'],
})
export class GameParametersPageComponent {
    private readonly gameHttpService = inject(GameHttpService);

    selectedMapSize: MapSize = MapSize.MEDIUM;
    selectedGameMode: GameMode = GameMode.CLASSIC;
    gameName: string = '';
    gameDescription: string = '';

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
    ) {}

    onCreate(): void {
        this.gameHttpService
            .createGame({
                name: this.gameName,
                description: this.gameDescription,
                size: this.selectedMapSize,
                mode: this.selectedGameMode,
                tiles: [],
                objects: [],
            })
            .subscribe({
                next: (game) => {
                    this.router.navigate([ROUTES.gameEditor, game.id]);
                },
            });
    }

    onBack(): void {
        this.location.back();
    }
}
