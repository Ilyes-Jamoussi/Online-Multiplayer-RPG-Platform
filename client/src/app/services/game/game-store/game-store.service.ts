import { computed, Injectable, Signal, signal } from '@angular/core';
import { CreateGameDto } from '@app/api/model/createGameDto';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
import { UpdateGameDto } from '@app/api/model/updateGameDto';
import { GameHttpService } from '@app/services/game/game-http/game-http.service';
import { GameStoreSocketService } from '@app/services/game/game-store-socket/game-store-socket.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Observable, tap } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class GameStoreService {
    private readonly _gameDisplays = signal<GamePreviewDto[]>([]);
    private _gameId: string = '';
    private readonly _name = signal<string>('');
    private readonly _description = signal<string>('');
    private readonly _mapSize = signal<MapSize>(MapSize.MEDIUM);
    private readonly _gameMode = signal<GameMode>(GameMode.CLASSIC);
    private readonly _gridPreviewImage = signal<string>('');

    constructor(
        private readonly gameHttpService: GameHttpService,
        private readonly gameStoreSocketService: GameStoreSocketService,
    ) {
        this.initListeners();
    }

    get gameDisplays(): Signal<GamePreviewDto[]> {
        return this._gameDisplays.asReadonly();
    }

    get visibleGames(): Signal<GamePreviewDto[]> {
        return computed(() => this._gameDisplays().filter((game) => game.visibility));
    }

    get name(): Signal<string> {
        return this._name.asReadonly();
    }

    get description(): Signal<string> {
        return this._description.asReadonly();
    }

    get mapSize(): Signal<MapSize> {
        return this._mapSize.asReadonly();
    }

    get gameMode(): Signal<GameMode> {
        return this._gameMode.asReadonly();
    }

    get gameId(): string {
        return this._gameId;
    }

    setGameId(id: string): void {
        this._gameId = id;
    }

    setName(name: string): void {
        this._name.set(name);
    }

    setDescription(description: string): void {
        this._description.set(description);
    }

    setMapSize(size: MapSize): void {
        this._mapSize.set(size);
    }

    setGameMode(mode: GameMode): void {
        this._gameMode.set(mode);
    }

    setGridPreviewImage(image: string): void {
        this._gridPreviewImage.set(image);
    }

    resetGameData(): void {
        this._gameId = '';
        this._name.set('');
        this._description.set('');
    }

    buildCreateGameDto(): CreateGameDto {
        return {
            name: this._name(),
            description: this._description(),
            size: this.mapSize(),
            mode: this.gameMode(),
            visibility: true,
            gridPreviewImage: this._gridPreviewImage(),
            tiles: [],
            objects: []
        };
    }

    buildUpdateGameDto(): UpdateGameDto {
        return {
            name: this._name(),
            description: this._description(),
            gridPreviewImage: this._gridPreviewImage(),
        };
    }

    loadGames(): Observable<GamePreviewDto[]> {
        return this.gameHttpService.getGamesDisplay().pipe(tap((games) => this._gameDisplays.set(games)));
    }

    createGame(): Observable<GamePreviewDto> {
        const dto = this.buildCreateGameDto();
        return this.gameHttpService.createGame(dto);
    }

    updateGame(): Observable<void> {
        const dto = this.buildUpdateGameDto();
        return this.gameHttpService.updateGame(this._gameId, dto);
    }

    deleteGame(id: string): Observable<void> {
        return this.gameHttpService.deleteGame(id);
    }

    toggleGameVisibility(id: string): Observable<void> {
        const game = this._gameDisplays().find((g) => g.id === id);
        if (!game) {
            throw new Error('Game not found');
        }
        return this.gameHttpService.toggleVisibility(id, { visibility: !game.visibility });
    }

    private initListeners(): void {
        this.gameStoreSocketService.onGameCreated((game) => this.insertGameDisplay(game));
        this.gameStoreSocketService.onGameUpdated((game) => this.replaceGameDisplay(game));
        this.gameStoreSocketService.onGameDeleted(({ id }) => this.removeGameDisplay(id));
        this.gameStoreSocketService.onGameVisibilityToggled(({ id }) => this.toggleGameDisplayVisibility(id));
    }

    private insertGameDisplay(dto: GamePreviewDto): void {
        this._gameDisplays.update((games) => [...games, dto]);
    }

    private replaceGameDisplay(dto: GamePreviewDto): void {
        this._gameDisplays.update((games) => games.map((g) => (g.id === dto.id ? dto : g)));
    }

    private removeGameDisplay(id: string): void {
        this._gameDisplays.update((games) => games.filter((g) => g.id !== id));
    }

    private toggleGameDisplayVisibility(id: string): void {
        this._gameDisplays.update((games) => games.map((g) => (g.id === id ? { ...g, visibility: !g.visibility } : g)));
    }
}
