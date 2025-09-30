import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CreateGameDto } from '@app/dto/create-game-dto';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { PatchGameEditorDto } from '@app/dto/patch-game-editor-dto';
import { ToggleVisibilityDto } from '@app/dto/toggle-visibility-dto';
import { API_PATHS } from '@common/constants/api-paths';
import { environment } from 'src/environments/environment';
import { GameHttpService } from './game-http.service';
import { GameMode } from '@common/enums/game-mode.enum';

describe('GameHttpService', () => {
    let service: GameHttpService;
    let httpMock: HttpTestingController;

    const baseUrl = environment.serverUrl;
    const gamesEndpoint = `${baseUrl}${API_PATHS.games.base}`;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GameHttpService, provideHttpClient(), provideHttpClientTesting()],
        });

        service = TestBed.inject(GameHttpService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getGamesDisplay', () => {
        it('should return games display', () => {
            const mockGames: GamePreviewDto[] = [
                {
                    id: '1',
                    name: 'Game 1',
                    description: 'Desc 1',
                    size: 10,
                    mode: GameMode.CLASSIC,
                    lastModified: '2023-01-01',
                    visibility: true,
                    gridPreviewUrl: '/assets/game1.png',
                    draft: false,
                },
            ];

            service.getGamesDisplay().subscribe((games) => {
                expect(games).toEqual(mockGames);
            });

            const req = httpMock.expectOne(gamesEndpoint);
            expect(req.request.method).toBe('GET');
            req.flush(mockGames);
        });
    });

    describe('createGame', () => {
        it('should create a game', () => {
            const createDto: CreateGameDto = {
                name: 'New Game',
                description: 'New Desc',
                size: 10,
                mode: GameMode.CLASSIC,
            };

            service.createGame(createDto).subscribe();

            const req = httpMock.expectOne(gamesEndpoint);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(createDto);
            req.flush(null);
        });
    });

    describe('getGameEditorById', () => {
        it('should return game editor dto for id', () => {
            const id = 'editor-1';
            const mockEditor: GameEditorDto = {
                id,
                name: 'Editor Name',
                description: 'Editor Desc',
                size: 10,
                mode: 'classic',
                grid: [],
                inventory: [],
            } as unknown as GameEditorDto;

            service.getGameEditorById(id).subscribe((editor) => {
                expect(editor).toEqual(mockEditor);
            });

            const req = httpMock.expectOne(`${gamesEndpoint}/${id}/editor/`);
            expect(req.request.method).toBe('GET');
            req.flush(mockEditor);
        });
    });

    describe('patchGameEditorById', () => {
        it('should patch editor and return updated dto', () => {
            const id = 'editor-2';
            const dto: PatchGameEditorDto = { name: 'Patched' } as unknown as PatchGameEditorDto;
            const updated: GamePreviewDto = {
                id,
                name: dto.name as string,
                description: 'd',
                size: 10,
                mode: GameMode.CLASSIC,
                lastModified: new Date().toISOString(),
                visibility: false,
                draft: false,
                gridPreviewUrl: '/assets/game.png',
            };

            service.patchGameEditorById(id, dto).subscribe((resp) => {
                expect(resp).toEqual(updated);
            });

            const req = httpMock.expectOne(`${gamesEndpoint}/${id}/editor/`);
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual(dto);
            req.flush(updated);
        });
    });

    describe('deleteGame', () => {
        it('should delete a game', () => {
            const gameId = '123';

            service.deleteGame(gameId).subscribe();

            const req = httpMock.expectOne(`${gamesEndpoint}/${gameId}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    describe('toggleVisibility', () => {
        it('should toggle game visibility', () => {
            const gameId = '123';
            const toggleDto: ToggleVisibilityDto = { visibility: true };

            service.toggleVisibility(gameId, toggleDto).subscribe();

            const req = httpMock.expectOne(`${gamesEndpoint}/${gameId}/visibility`);
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual(toggleDto);
            req.flush(null);
        });
    });
});
