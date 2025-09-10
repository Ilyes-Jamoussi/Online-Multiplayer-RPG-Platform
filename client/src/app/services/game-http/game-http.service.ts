import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateGameDto, GameInitDto, GamePreviewDto, ToggleVisibilityDto, UpdateGameDto } from '@app/api/model/models';
import { API_PATHS } from '@common/constants/api-paths';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class GameHttpService {
    private readonly baseUrl: string = environment.serverUrl;
    private readonly gamesEndpoint: string = `${this.baseUrl}${API_PATHS.games.base}`;

    constructor(private readonly http: HttpClient) {}

    getGamesDisplay(): Observable<GamePreviewDto[]> {
        return this.http.get<GamePreviewDto[]>(this.gamesEndpoint);
    }

    getGameInitializationData(gameId: string): Observable<GameInitDto> {
        return this.http.get<GameInitDto>(`${this.gamesEndpoint}/${gameId}/init`);
    }

    createGame(dto: CreateGameDto): Observable<void> {
        return this.http.post<void>(this.gamesEndpoint, dto);
    }

    updateGame(id: string, dto: UpdateGameDto): Observable<void> {
        return this.http.patch<void>(`${this.gamesEndpoint}/${id}`, dto);
    }

    deleteGame(id: string): Observable<void> {
        return this.http.delete<void>(`${this.gamesEndpoint}/${id}`);
    }

    toggleVisibility(id: string, dto: ToggleVisibilityDto): Observable<void> {
        return this.http.patch<void>(`${this.gamesEndpoint}/${id}/visibility`, dto);
    }
}
