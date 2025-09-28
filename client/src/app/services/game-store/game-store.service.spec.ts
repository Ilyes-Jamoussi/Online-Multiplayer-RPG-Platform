import { TestBed } from '@angular/core/testing';
import { CreateGameDto } from '@app/dto/createGameDto';
import { GamePreviewDto } from '@app/dto/gamePreviewDto';
import { UpdateGameDto } from '@app/dto/updateGameDto';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { GameSocketService } from '@app/services/game-socket/game-socket.service';
import { MapSize } from '@common/enums/map-size.enum';
import { of } from 'rxjs';
import { GameStoreService } from './game-store.service';

describe('GameStoreService', () => {
    let service: GameStoreService;
    let gameHttpServiceSpy: jasmine.SpyObj<GameHttpService>;
    let gameStoreSocketServiceSpy: jasmine.SpyObj<GameSocketService>;

    const mockGames: GamePreviewDto[] = [
        {
            id: '1',
            name: 'Game 1',
            description: 'Desc 1',
            size: 10,
            mode: 'classic',
            lastModified: '2023-01-01',
            visibility: true,
            gridPreviewUrl: '/assets/game1.png',
            draft: false,
        },
        {
            id: '2',
            name: 'Game 2',
            description: 'Desc 2',
            size: 15,
            mode: 'classic',
            lastModified: '2023-01-02',
            visibility: false,
            gridPreviewUrl: '/assets/game2.png',
            draft: false,
        },
    ];

    beforeEach(() => {
        const gameHttpSpy = jasmine.createSpyObj('GameHttpService', [
            'getGamesDisplay',
            'createGame',
            'updateGame',
            'deleteGame',
            'toggleVisibility',
        ]);
        const gameStoreSocketSpy = jasmine.createSpyObj('GameStoreSocketService', [
            'onGameCreated',
            'onGameUpdated',
            'onGameDeleted',
            'onGameVisibilityToggled',
        ]);

        TestBed.configureTestingModule({
            providers: [
                { provide: GameHttpService, useValue: gameHttpSpy },
                { provide: GameSocketService, useValue: gameStoreSocketSpy },
            ],
        });

        service = TestBed.inject(GameStoreService);
        gameHttpServiceSpy = TestBed.inject(GameHttpService) as jasmine.SpyObj<GameHttpService>;
        gameStoreSocketServiceSpy = TestBed.inject(GameSocketService) as jasmine.SpyObj<GameSocketService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize socket listeners on construction', () => {
        expect(gameStoreSocketServiceSpy.onGameCreated).toHaveBeenCalled();
        expect(gameStoreSocketServiceSpy.onGameUpdated).toHaveBeenCalled();
        expect(gameStoreSocketServiceSpy.onGameDeleted).toHaveBeenCalled();
        expect(gameStoreSocketServiceSpy.onGameVisibilityToggled).toHaveBeenCalled();
    });

    describe('gameDisplays', () => {
        it('should return readonly signal of game displays', () => {
            const gameDisplays = service.gameDisplays;
            expect(gameDisplays()).toEqual([]);
        });
    });

    describe('visibleGames', () => {
        it('should return only visible games', () => {
            gameHttpServiceSpy.getGamesDisplay.and.returnValue(of(mockGames));

            service.loadGames().subscribe();

            const visibleGames = service.visibleGames();
            expect(visibleGames).toEqual([mockGames[0]]);
        });

        it('managementGames should return only non-draft games', () => {
            const mixed: GamePreviewDto[] = [
                { ...mockGames[0], draft: false },
                { ...mockGames[1], draft: true },
            ];
            gameHttpServiceSpy.getGamesDisplay.and.returnValue(of(mixed));

            service.loadGames().subscribe();

            const management = service.managementGames();
            expect(management.every((g) => !g.draft)).toBeTrue();
            expect(management).toEqual([mixed[0]]);
        });
    });

    describe('loadGames', () => {
        it('should load games and update signal', () => {
            gameHttpServiceSpy.getGamesDisplay.and.returnValue(of(mockGames));

            service.loadGames().subscribe();

            expect(gameHttpServiceSpy.getGamesDisplay).toHaveBeenCalled();
            expect(service.gameDisplays()).toEqual(mockGames);
        });
    });

    describe('deleteGame', () => {
        it('should call gameHttpService.deleteGame', () => {
            gameHttpServiceSpy.deleteGame.and.returnValue(of(undefined));

            service.deleteGame('1').subscribe();

            expect(gameHttpServiceSpy.deleteGame).toHaveBeenCalledWith('1');
        });
    });

    describe('create/update wrappers', () => {
        it('createGame should call http createGame with payload', () => {
            const payload: CreateGameDto = { name: 'C1', description: 'd', size: 10, mode: 'classic' } as CreateGameDto;
            gameHttpServiceSpy.createGame.and.returnValue(of(mockGames[0]));

            service.createGame(payload).subscribe((res) => {
                expect(res).toBe(mockGames[0]);
            });

            expect(gameHttpServiceSpy.createGame).toHaveBeenCalledWith(payload);
        });

        it('updateGame should call http updateGame with stored _gameId', () => {
            const update: UpdateGameDto = { name: 'U1' } as UpdateGameDto;
            const NEW_ID = 'stored-id-123';
            (service as unknown as { _gameId: string })._gameId = NEW_ID;
            gameHttpServiceSpy.updateGame.and.returnValue(of(undefined));

            service.updateGame(update).subscribe(() => {
                expect(gameHttpServiceSpy.updateGame).toHaveBeenCalledWith(NEW_ID, update);
            });
        });
    });

    describe('toggleGameVisibility', () => {
        beforeEach(() => {
            gameHttpServiceSpy.getGamesDisplay.and.returnValue(of(mockGames));
            service.loadGames().subscribe();
        });

        it('should toggle visibility of existing game', () => {
            gameHttpServiceSpy.toggleVisibility.and.returnValue(of(undefined));

            service.toggleGameVisibility('1').subscribe();

            expect(gameHttpServiceSpy.toggleVisibility).toHaveBeenCalledWith('1', { visibility: false });
        });

        it('should throw error if game not found', () => {
            expect(() => service.toggleGameVisibility('999')).toThrowError('Game not found');
        });
    });

    describe('socket event handlers', () => {
        beforeEach(() => {
            gameHttpServiceSpy.getGamesDisplay.and.returnValue(of(mockGames));
            service.loadGames().subscribe();
        });

        it('should handle game created event', () => {
            const newGame: GamePreviewDto = {
                id: '3',
                name: 'Game 3',
                description: 'Desc 3',
                size: MapSize.LARGE,
                mode: 'classic',
                lastModified: '2023-01-03',
                visibility: true,
                gridPreviewUrl: '/assets/game3.png',
                draft: false,
            };
            const callback = gameStoreSocketServiceSpy.onGameCreated.calls.argsFor(0)[0];

            callback(newGame);

            expect(service.gameDisplays()).toContain(newGame);
        });

        it('should handle game updated event', () => {
            const updatedGame: GamePreviewDto = { ...mockGames[0], name: 'Updated Game 1' };
            const callback = gameStoreSocketServiceSpy.onGameUpdated.calls.argsFor(0)[0];

            callback(updatedGame);

            expect(service.gameDisplays()[0].name).toBe('Updated Game 1');
        });

        it('should add updated game when it does not exist (replace branch else)', () => {
            const newGame: GamePreviewDto = {
                id: 'new-99',
                name: 'Brand New',
                description: 'new',
                size: MapSize.MEDIUM,
                mode: 'classic',
                lastModified: '2023-01-04',
                visibility: true,
                gridPreviewUrl: '/assets/new.png',
                draft: false,
            };

            const callback = gameStoreSocketServiceSpy.onGameUpdated.calls.argsFor(0)[0];

            callback(newGame);

            expect(service.gameDisplays().some((g) => g.id === newGame.id)).toBeTrue();
        });

        it('should handle game deleted event', () => {
            const callback = gameStoreSocketServiceSpy.onGameDeleted.calls.argsFor(0)[0];

            callback({ id: '1' });

            expect(service.gameDisplays().find((g) => g.id === '1')).toBeUndefined();
        });

        it('should handle game visibility toggled event', () => {
            const callback = gameStoreSocketServiceSpy.onGameVisibilityToggled.calls.argsFor(0)[0];

            callback({ id: '1' });

            expect(service.gameDisplays()[0].visibility).toBe(false);
        });
    });
});
