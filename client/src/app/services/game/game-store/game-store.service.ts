import { computed, Injectable, Signal, signal } from '@angular/core';
import { CreateGameDto, GamePreviewDto, UpdateGameDto } from '@app/api/model/models';
import { GameHttpService } from '@app/services/game/game-http/game-http.service';
import { GameStoreSocketService } from '@app/services/game/game-store-socket/game-store-socket.service';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GameStoreService {
    private readonly _gameDisplays = signal<GamePreviewDto[]>([]);

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

    loadGames(): Observable<GamePreviewDto[]> {
        return this.gameHttpService.getGamesDisplay().pipe(tap((games) => this._gameDisplays.set(games)));
    }

    createGame(dto: CreateGameDto): Observable<GamePreviewDto> {
        return this.gameHttpService.createGame(dto);
    }

    updateGame(id: string, dto: UpdateGameDto): Observable<void> {
        return this.gameHttpService.updateGame(id, dto);
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
