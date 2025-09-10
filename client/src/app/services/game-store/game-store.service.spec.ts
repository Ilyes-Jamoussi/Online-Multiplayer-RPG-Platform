import { TestBed } from '@angular/core/testing';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { GameStoreSocketService } from '@app/services/game-store-socket/game-store-socket.service';
import { CreateGameDto } from '@common/dto/game-store/create-game.dto';
import { DisplayGameDto } from '@common/dto/game-store/display-game.dto';
import { UpdateGameDto } from '@common/dto/game-store/update-game.dto';
import { MapSize } from '@common/enums/map-size.enum';
import { of } from 'rxjs';
import { GameStoreService } from './game-store.service';

describe('GameStoreService', () => {
    let service: GameStoreService;
    let httpServiceSpy: jasmine.SpyObj<GameHttpService>;
    let socketServiceSpy: jasmine.SpyObj<GameStoreSocketService>;

    const mockGame: DisplayGameDto = {
        id: '1',
        name: 'Test Game',
        description: 'Test Description',
        size: MapSize.Small,
        mapPreviewImageUrl: 'preview.jpg',
        lastModified: new Date(),
        visibility: true,
    };

    beforeEach(() => {
        const httpSpy = jasmine.createSpyObj('GameHttpService', ['getGamesDisplay', 'createGame', 'updateGame', 'deleteGame', 'toggleVisibility']);
        const socketSpy = jasmine.createSpyObj('GameStoreSocketService', [
            'onGameCreated',
            'onGameUpdated',
            'onGameDeleted',
            'onGameVisibilityToggled',
        ]);

        TestBed.configureTestingModule({
            providers: [GameStoreService, { provide: GameHttpService, useValue: httpSpy }, { provide: GameStoreSocketService, useValue: socketSpy }],
        });

        service = TestBed.inject(GameStoreService);
        httpServiceSpy = TestBed.inject(GameHttpService) as jasmine.SpyObj<GameHttpService>;
        socketServiceSpy = TestBed.inject(GameStoreSocketService) as jasmine.SpyObj<GameStoreSocketService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize listeners on construction', () => {
        expect(socketServiceSpy.onGameCreated).toHaveBeenCalled();
        expect(socketServiceSpy.onGameUpdated).toHaveBeenCalled();
        expect(socketServiceSpy.onGameDeleted).toHaveBeenCalled();
        expect(socketServiceSpy.onGameVisibilityToggled).toHaveBeenCalled();
    });

    it('should load games', (done) => {
        const games: DisplayGameDto[] = [mockGame];
        httpServiceSpy.getGamesDisplay.and.returnValue(of(games));

        service.loadGames().subscribe(() => {
            expect(service.gameDisplays()).toEqual(games);
            done();
        });
    });

    it('should create a game', (done) => {
        const createDto: CreateGameDto = {
            name: 'New Game',
            description: 'New Game Description',
            size: MapSize.Small,
            map: [],
            items: [],
            mapPreviewImage: 'preview.jpg',
        };

        httpServiceSpy.createGame.and.returnValue(of(void 0));

        service.createGame(createDto).subscribe(() => {
            expect(httpServiceSpy.createGame).toHaveBeenCalledWith(createDto);
            done();
        });
    });

    it('should update a game', (done) => {
        const updateDto: UpdateGameDto = {
            name: 'Updated Game',
            description: 'Updated Description',
            map: [],
            items: [],
            mapPreviewImage: 'updated-preview.jpg',
        };

        httpServiceSpy.updateGame.and.returnValue(of(void 0));

        service.updateGame('1', updateDto).subscribe(() => {
            expect(httpServiceSpy.updateGame).toHaveBeenCalledWith('1', updateDto);
            done();
        });
    });

    it('should delete a game', (done) => {
        httpServiceSpy.deleteGame.and.returnValue(of(void 0));

        service.deleteGame('1').subscribe(() => {
            expect(httpServiceSpy.deleteGame).toHaveBeenCalledWith('1');
            done();
        });
    });

    it('should toggle game visibility', (done) => {
        service['_gameDisplays'].set([mockGame]);
        httpServiceSpy.toggleVisibility.and.returnValue(of(void 0));

        service.toggleGameVisibility('1').subscribe(() => {
            expect(httpServiceSpy.toggleVisibility).toHaveBeenCalledWith('1', { visibility: false });
            done();
        });
    });

    it('should throw error when toggling visibility of non-existent game', () => {
        service['_gameDisplays'].set([]);
        expect(() => service.toggleGameVisibility('1')).toThrowError('Game not found');
    });

    it('should return visible games only', () => {
        const games: DisplayGameDto[] = [
            { ...mockGame, visibility: true },
            { ...mockGame, id: '2', visibility: false },
        ];
        service['_gameDisplays'].set(games);
        expect(service.visibleGames().length).toBe(1);
        expect(service.visibleGames()[0].id).toBe('1');
    });

    it('should handle socket events correctly', () => {
        // Test game created
        socketServiceSpy.onGameCreated.and.callFake((callback) => callback(mockGame));
        expect(service.gameDisplays().length).toBe(1);

        // Test game updated
        const updatedGame = { ...mockGame, name: 'Updated' };
        socketServiceSpy.onGameUpdated.and.callFake((callback) => callback(updatedGame));
        expect(service.gameDisplays()[0].name).toBe('Updated');

        // Test game deleted
        socketServiceSpy.onGameDeleted.and.callFake((callback) => callback({ id: '1' }));
        expect(service.gameDisplays().length).toBe(0);

        // Test visibility toggled
        service['_gameDisplays'].set([mockGame]);
        socketServiceSpy.onGameVisibilityToggled.and.callFake((callback) => callback({ id: '1' }));
        expect(service.gameDisplays()[0].visibility).toBe(false);
    });
});
