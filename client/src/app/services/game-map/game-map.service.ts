import { Injectable, signal } from '@angular/core';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { catchError, of, take, tap } from 'rxjs';

@Injectable()
export class GameMapService {
    private readonly initialState = {
        tiles: [],
        objects: [],
        size: MapSize.MEDIUM,
        name: '',
        description: '',
        mode: GameMode.CLASSIC
    };

    private readonly _tiles = signal<GameEditorTileDto[]>(this.initialState.tiles);
    private readonly _objects = signal<GameEditorPlaceableDto[]>(this.initialState.objects);
    private readonly _size = signal<MapSize>(this.initialState.size);
    private readonly _name = signal<string>(this.initialState.name);
    private readonly _description = signal<string>(this.initialState.description);
    private readonly _mode = signal<GameMode>(this.initialState.mode);

    constructor(
        private readonly gameHttpService: GameHttpService,
        private readonly notificationService: NotificationService
    ) {}

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

    loadGameMap(gameId: string): void {
        this.gameHttpService
            .getGameEditorById(gameId)
            .pipe(
                take(1),
                tap((gameData) => {
                    this.setGameData(gameData);
                    this.buildGameMap(gameData);
                }),
                catchError(() => {
                    this.notificationService.displayError({ title: 'Erreur', message: 'Erreur lors du chargement de la carte' });
                    return of(null);
                }),
            )
            .subscribe();
    }

    private buildGameMap(gameData: GameEditorDto): void {
        this._name.set(gameData.name);
        this._description.set(gameData.description);
        this._size.set(gameData.size);
        this._mode.set(gameData.mode);

        const tiles: GameEditorTileDto[] = gameData.tiles.map(tile => ({
            ...tile,
            open: tile.open ?? false
        }));

        const objects: GameEditorPlaceableDto[] = gameData.objects.map(obj => ({
            ...obj,
            placed: obj.placed || true
        }));

        this._tiles.set(tiles);
        this._objects.set(objects);
    }

    reset(): void {
        Object.entries(this.initialState).forEach(([key, value]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any)[`_${key}`].set(value);
        });
    }
}
