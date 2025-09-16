import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateGameDto } from '@app/api/model/createGameDto';
import { GameInitDto } from '@app/api/model/gameInitDto';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
import { ReadGameDto } from '@app/api/model/readGameDto';
import { SaveGameDto } from '@app/api/model/saveGameDto';
import { ToggleVisibilityDto } from '@app/api/model/toggleVisibilityDto';
import { API_PATHS } from '@common/constants/api-paths';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class GameHttpService {
    private readonly baseUrl = environment.serverUrl;
    private readonly gamesEndpoint = `${this.baseUrl}${API_PATHS.games.base}`;

    constructor(private readonly http: HttpClient) {}

    getGamesDisplay(): Observable<GamePreviewDto[]> {
        return this.http.get<GamePreviewDto[]>(this.gamesEndpoint);
    }

    getGameInitializationData(gameId: string): Observable<GameInitDto> {
        return this.http.get<GameInitDto>(`${this.gamesEndpoint}/${gameId}/init`);
    }

    getGameById(gameId: string): Observable<ReadGameDto> {
        return this.http.get<ReadGameDto>(`${this.gamesEndpoint}/${gameId}`);
    }

    createGame(dto: CreateGameDto): Observable<GamePreviewDto> {
        return this.http.post<GamePreviewDto>(this.gamesEndpoint, dto);
    }

    updateGame(id: string, dto: SaveGameDto): Observable<void> {
        return this.http.patch<void>(`${this.gamesEndpoint}/${id}`, dto);
    }

    toggleVisibility(id: string, dto: ToggleVisibilityDto): Observable<void> {
        return this.http.patch<void>(`${this.gamesEndpoint}/${id}/visibility`, dto);
    }

    deleteGame(id: string): Observable<void> {
        return this.http.delete<void>(`${this.gamesEndpoint}/${id}`);
    }
}
