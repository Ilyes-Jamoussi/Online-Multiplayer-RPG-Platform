import { computed, Injectable, Signal, signal } from '@angular/core';
import { CreateGameDto } from '@app/dto/create-game-dto';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { UpdateGameDto } from '@app/dto/update-game-dto';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { GameSocketService } from '@app/services/game-socket/game-socket.service';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GameStoreService {
    private readonly _gameDisplays = signal<GamePreviewDto[]>([]);
    private _gameId: string = '';

    constructor(
        private readonly gameHttpService: GameHttpService,
        private readonly gameStoreSocketService: GameSocketService,
    ) {
        this.initListeners();
    }

    get gameDisplays(): Signal<GamePreviewDto[]> {
        return this._gameDisplays.asReadonly();
    }

    get managementGames(): Signal<GamePreviewDto[]> {
        return computed(() => this._gameDisplays().filter((game) => !game.draft));
    }

    get visibleGames(): Signal<GamePreviewDto[]> {
        return computed(() => this._gameDisplays().filter((game) => !game.draft && game.visibility));
    }

    loadGames(): Observable<GamePreviewDto[]> {
        return this.gameHttpService.getGamesDisplay().pipe(tap((games) => this._gameDisplays.set(games)));
    }

    createGame(payload: CreateGameDto): Observable<GamePreviewDto> {
        return this.gameHttpService.createGame(payload);
    }

    updateGame(payload: UpdateGameDto): Observable<void> {
        return this.gameHttpService.updateGame(this._gameId, payload);
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
        const exists = this._gameDisplays().some((g) => g.id === dto.id);
        this._gameDisplays.update((games) => (exists ? games.map((g) => (g.id === dto.id ? dto : g)) : [...games, dto]));
    }

    private removeGameDisplay(id: string): void {
        this._gameDisplays.update((games) => games.filter((g) => g.id !== id));
    }

    private toggleGameDisplayVisibility(id: string): void {
        this._gameDisplays.update((games) => games.map((g) => (g.id === id ? { ...g, visibility: !g.visibility } : g)));
    }
}
