import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_PATHS } from '@common/constants/api-paths';
import { CreateGameDto } from '@common/dto/game-store/create-game.dto';
import { DisplayGameDto } from '@common/dto/game-store/display-game.dto';
import { GameInitializationDataDto } from '@common/dto/game-store/game-initialization-data.dto';
import { ToggleVisibilityDto } from '@common/dto/game-store/toggle-visibility.dto';
import { UpdateGameDto } from '@common/dto/game-store/update-game.dto';
import { MapSize } from '@common/enums/map-size.enum';
import { TileType } from '@common/enums/tile-type.enum';
import { ItemContainer } from '@common/interfaces/item-container.interface';
import { Tile } from '@common/interfaces/tile.interface';
import { environment } from 'src/environments/environment';
import { GameHttpService } from './game-http.service';

describe('GameHttpService', () => {
    let service: GameHttpService;
    let httpMock: HttpTestingController;
    const baseUrl = environment.serverUrl;
    const gamesEndpoint = `${baseUrl}${API_PATHS.games.base}`;
    const HTTP_NOT_FOUND = 404;

    const mockTiles: Tile[][] = [[{ type: TileType.Sand, item: null }]];
    const mockItems: ItemContainer[] = [];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GameHttpService, provideHttpClient(withFetch())],
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
        it('should make a GET request to fetch games display', () => {
            const mockGames: DisplayGameDto[] = [
                {
                    id: '1',
                    name: 'Game 1',
                    size: MapSize.Small,
                    description: 'Test game 1',
                    mapPreviewImageUrl: 'preview1.jpg',
                    lastModified: new Date(),
                    visibility: true,
                },
                {
                    id: '2',
                    name: 'Game 2',
                    size: MapSize.Medium,
                    description: 'Test game 2',
                    mapPreviewImageUrl: 'preview2.jpg',
                    lastModified: new Date(),
                    visibility: false,
                },
            ];

            service.getGamesDisplay().subscribe((games) => {
                expect(games).toEqual(mockGames);
            });

            const req = httpMock.expectOne(`${gamesEndpoint}/displays`);
            expect(req.request.method).toBe('GET');
            req.flush(mockGames);
        });
    });

    describe('getGameInitializationData', () => {
        it('should make a GET request to fetch game initialization data', () => {
            const gameId = '123';
            const mockData: GameInitializationDataDto = {
                mapSize: MapSize.Small,
                map: mockTiles,
                itemContainers: mockItems,
            };

            service.getGameInitializationData(gameId).subscribe((data) => {
                expect(data).toEqual(mockData);
            });

            const req = httpMock.expectOne(`${gamesEndpoint}/${gameId}/initialization-data`);
            expect(req.request.method).toBe('GET');
            req.flush(mockData);
        });
    });

    describe('createGame', () => {
        it('should make a POST request to create a game', () => {
            const mockDto: CreateGameDto = {
                name: 'New Game',
                size: MapSize.Small,
                description: 'A new test game',
                map: mockTiles,
                items: mockItems,
                mapPreviewImage: 'preview.jpg',
            };

            service.createGame(mockDto).subscribe();

            const req = httpMock.expectOne(gamesEndpoint);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(mockDto);
            req.flush(null);
        });
    });

    describe('updateGame', () => {
        it('should make a PATCH request to update a game', () => {
            const gameId = '123';
            const mockDto: UpdateGameDto = {
                name: 'Updated Game',
                description: 'Updated description',
                map: mockTiles,
                items: mockItems,
                mapPreviewImage: 'updated-preview.jpg',
            };

            service.updateGame(gameId, mockDto).subscribe();

            const req = httpMock.expectOne(`${gamesEndpoint}/${gameId}`);
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual(mockDto);
            req.flush(null);
        });
    });

    describe('deleteGame', () => {
        it('should make a DELETE request to delete a game', () => {
            const gameId = '123';

            service.deleteGame(gameId).subscribe();

            const req = httpMock.expectOne(`${gamesEndpoint}/${gameId}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    describe('toggleVisibility', () => {
        it('should make a PATCH request to toggle game visibility', () => {
            const gameId = '123';
            const mockDto: ToggleVisibilityDto = {
                visibility: true,
            };

            service.toggleVisibility(gameId, mockDto).subscribe();

            const req = httpMock.expectOne(`${gamesEndpoint}/${gameId}/visibility`);
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual(mockDto);
            req.flush(null);
        });
    });

    describe('Error handling', () => {
        it('should handle HTTP errors appropriately', () => {
            service.getGamesDisplay().subscribe({
                error: (error) => {
                    expect(error.status).toBe(HTTP_NOT_FOUND);
                },
            });

            const req = httpMock.expectOne(`${gamesEndpoint}/displays`);
            req.flush('Not found', { status: HTTP_NOT_FOUND, statusText: 'Not Found' });
        });
    });
});
