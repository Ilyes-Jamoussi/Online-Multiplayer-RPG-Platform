import { Injectable, signal } from '@angular/core';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { catchError, of, take, tap } from 'rxjs';

@Injectable()
export class GameMapService {
    private readonly _tiles = signal<GameEditorTileDto[]>([]);
    private readonly _objects = signal<GameEditorPlaceableDto[]>([]);
    private readonly _size = signal<MapSize>(MapSize.MEDIUM);
    private readonly _name = signal<string>('');
    private readonly _description = signal<string>('');
    private readonly _mode = signal<GameMode>(GameMode.CLASSIC);
    private readonly _loading = signal<boolean>(false);
    private readonly _error = signal<boolean>(false);

    constructor(private readonly gameHttpService: GameHttpService) {}

    get tiles() {
        return this._tiles.asReadonly();
    }

    get objects() {
        return this._objects.asReadonly();
    }

    get size() {
        return this._size.asReadonly();
    }

    get name() {
        return this._name.asReadonly();
    }

    get description() {
        return this._description.asReadonly();
    }

    get mode() {
        return this._mode.asReadonly();
    }

    get loading() {
        return this._loading.asReadonly();
    }

    get error() {
        return this._error.asReadonly();
    }

    loadGameMap(gameId: string): void {
        this._loading.set(true);
        this._error.set(false);

        this.gameHttpService
            .getGameEditorById(gameId)
            .pipe(
                take(1),
                tap((gameData) => {
                    if (!gameData) {
                        this._error.set(true);
                        this._loading.set(false);
                        return;
                    }

                    // Recréer la carte à partir des données sauvegardées
                    this.buildGameMap(gameData);
                    this._loading.set(false);
                }),
                catchError(() => {
                    this._error.set(true);
                    this._loading.set(false);
                    return of(null);
                }),
            )
            .subscribe();
    }

    private buildGameMap(gameData: GameEditorDto): void {
        // Stocker les informations de base
        this._name.set(gameData.name);
        this._description.set(gameData.description);
        this._size.set(gameData.size);
        this._mode.set(gameData.mode);

        // Recréer les tuiles avec leurs positions
        const tiles: GameEditorTileDto[] = gameData.tiles.map(tile => ({
            ...tile,
            // Ajouter des propriétés par défaut si nécessaires
            open: tile.open ?? false
        }));

        // Recréer les objets placés
        const objects: GameEditorPlaceableDto[] = gameData.objects.map(obj => ({
            ...obj,
            // Ajouter des propriétés par défaut si nécessaires
            placed: obj.placed ?? true
        }));

        this._tiles.set(tiles);
        this._objects.set(objects);
    }

    reset(): void {
        this._tiles.set([]);
        this._objects.set([]);
        this._size.set(MapSize.MEDIUM);
        this._name.set('');
        this._description.set('');
        this._mode.set(GameMode.CLASSIC);
        this._loading.set(false);
        this._error.set(false);
    }
}
