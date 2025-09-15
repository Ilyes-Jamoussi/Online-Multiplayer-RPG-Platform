import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { GameHttpService } from '@app/services/game/game-http/game-http.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MAP_SIZE_TO_MAX_PLAYERS, MapSize } from '@common/enums/map-size.enum';

interface MapSizeOption {
    value: MapSize;
    label: string;
    maxPlayers: number;
}

interface GameModeOption {
    value: GameMode;
    label: string;
    description: string;
}

@Component({
    selector: 'app-game-parameters-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './game-parameters-page.component.html',
    styleUrls: ['./game-parameters-page.component.scss'],
})
export class GameParametersPageComponent {
    private readonly gameHttpService = inject(GameHttpService);

    selectedMapSize: MapSize = MapSize.Medium;
    selectedGameMode: GameMode = GameMode.Classic;
    gameName: string = '';
    gameDescription: string = '';

    readonly mapSizeOptions: MapSizeOption[] = [
        {
            value: MapSize.Small,
            label: `Petite (${MapSize.Small}x${MapSize.Small})`,
            maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.Small],
        },
        {
            value: MapSize.Medium,
            label: `Moyenne (${MapSize.Medium}x${MapSize.Medium})`,
            maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.Medium],
        },
        {
            value: MapSize.Large,
            label: `Grande (${MapSize.Large}x${MapSize.Large})`,
            maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.Large],
        },
    ];

    readonly gameModeOptions: GameModeOption[] = [
        {
            value: GameMode.Classic,
            label: 'Classique',
            description: 'Mode de jeu standard',
        },
        {
            value: GameMode.CaptureTheFlag,
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
