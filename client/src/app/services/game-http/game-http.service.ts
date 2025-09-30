import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateGameDto } from '@app/dto/create-game-dto';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameInitDto } from '@app/dto/game-init-dto';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { PatchGameEditorDto } from '@app/dto/patch-game-editor-dto';
import { ToggleVisibilityDto } from '@app/dto/toggle-visibility-dto';
import { UpdateGameDto } from '@app/dto/update-game-dto';
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

    getGameEditorById(id: string): Observable<GameEditorDto> {
        return this.http.get<GameEditorDto>(`${this.gamesEndpoint}/${id}/editor/`);
    }

    patchGameEditorById(id: string, dto: PatchGameEditorDto): Observable<GamePreviewDto> {
        return this.http.patch<GamePreviewDto>(`${this.gamesEndpoint}/${id}/editor/`, dto);
    }

    createGame(dto: CreateGameDto): Observable<GamePreviewDto> {
        return this.http.post<GamePreviewDto>(this.gamesEndpoint, dto);
    }

    updateGame(id: string, dto: UpdateGameDto): Observable<void> {
        return this.http.patch<void>(`${this.gamesEndpoint}/${id}`, dto);
    }

    toggleVisibility(id: string, dto: ToggleVisibilityDto): Observable<void> {
        return this.http.patch<void>(`${this.gamesEndpoint}/${id}/visibility`, dto);
    }

    deleteGame(id: string): Observable<void> {
        return this.http.delete<void>(`${this.gamesEndpoint}/${id}`);
    }
}
