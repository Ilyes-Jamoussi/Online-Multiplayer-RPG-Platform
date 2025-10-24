import { Injectable, Signal, computed, signal } from '@angular/core';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { catchError, of, take, tap } from 'rxjs';
import { InGameService } from '@app/services/in-game/in-game.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGamePlayer } from '@common/models/player.interface';

@Injectable()
export class GameMapService {
    private readonly initialState = {
        tiles: [],
        objects: [],
        size: MapSize.MEDIUM,
        name: '',
        description: '',
        mode: GameMode.CLASSIC,
    };

    private readonly _tiles = signal<GameEditorTileDto[]>(this.initialState.tiles);
    private readonly _objects = signal<GameEditorPlaceableDto[]>(this.initialState.objects);
    private readonly _size = signal<MapSize>(this.initialState.size);
    private readonly _name = signal<string>(this.initialState.name);
    private readonly _description = signal<string>(this.initialState.description);
    private readonly _mode = signal<GameMode>(this.initialState.mode);
    private readonly _activeTileCoords = signal<{ x: number; y: number } | null>(null);

    readonly visibleObjects: Signal<GameEditorPlaceableDto[]> = computed(() => {
        const visibleObjects = this.objects().filter((obj) => obj.placed);
        return visibleObjects.filter((obj) => this.inGameService.startPoints().some((startPoint) => startPoint.id === obj.id));
    });

    constructor(
        private readonly gameHttpService: GameHttpService,
        private readonly notificationService: NotificationService,
        private readonly inGameService: InGameService,
        private readonly assetsService: AssetsService,
    ) {}

    get players() {
        return this.inGameService.inGamePlayers();
    }

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

    get activeTileCoords() {
        return this._activeTileCoords.asReadonly();
    }

    getActiveTile(): GameEditorTileDto | null {
        const coords = this._activeTileCoords();
        if (!coords) return null;
        return this.tiles().find((t) => t.x === coords.x && t.y === coords.y) ?? null;
    }

    openTileModal(tile: GameEditorTileDto): void {
        this._activeTileCoords.set({ x: tile.x, y: tile.y });
    }

    closeTileModal(): void {
        this._activeTileCoords.set(null);
    }

    isTileModalOpen(tile: GameEditorTileDto): boolean {
        const coords = this._activeTileCoords();
        return !!coords && coords.x === tile.x && coords.y === tile.y;
    }

    getPlayerOnTile(): InGamePlayer | undefined {
        const coords = this._activeTileCoords();
        if (!coords) return undefined;
        return this.currentlyInGamePlayers.find((player) => player.x === coords.x && player.y === coords.y);
    }

    getObjectOnTile(): GameEditorPlaceableDto | undefined {
        const coords = this._activeTileCoords();
        if (!coords) return undefined;
        return this.objects().find((obj) => obj.x === coords.x && obj.y === coords.y);
    }

    get currentlyInGamePlayers(): InGamePlayer[] {
        return this.inGameService.currentlyInGamePlayers;
    }

    loadGameMap(gameId: string): void {
        this.gameHttpService
            .getGameEditorById(gameId)
            .pipe(
                take(1),
                tap((gameData) => {
                    if (!gameData) {
                        this.notificationService.displayError({ title: 'Erreur', message: 'Impossible de charger la carte' });
                        return;
                    }
                    this.buildGameMap(gameData);
                }),
                catchError(() => {
                    this.notificationService.displayError({ title: 'Erreur', message: 'Erreur lors du chargement de la carte' });
                    return of(null);
                }),
            )
            .subscribe();
    }

    getAvatarByPlayerId(playerId: string): string {
        const player = this.inGameService.getPlayerByPlayerId(playerId);
        if (!player?.avatar) return '';
        return this.assetsService.getAvatarStaticImage(player.avatar);
    }

    private buildGameMap(gameData: GameEditorDto): void {
        this._name.set(gameData.name);
        this._description.set(gameData.description);
        this._size.set(gameData.size);
        this._mode.set(gameData.mode);

        const tiles: GameEditorTileDto[] = gameData.tiles.map((tile) => ({
            ...tile,
            open: tile.open ?? false,
        }));

        const objects: GameEditorPlaceableDto[] = gameData.objects.map((obj) => ({
            ...obj,
            placed: obj.placed ?? true,
        }));

        this._tiles.set(tiles);
        this._objects.set(objects);
    }

    reset(): void {
        Object.entries(this.initialState).forEach(([key, value]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any)[`_${key}`].set(value);
        });
        this._activeTileCoords.set(null);
    }
}
