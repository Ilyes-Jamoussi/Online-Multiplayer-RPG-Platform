import { TestBed } from '@angular/core/testing';
import { CreateGameDto } from '@app/dto/create-game-dto';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { GameSocketService } from '@app/services/game-socket/game-socket.service';
import { GameTab } from '@app/types/game-tab.types';
import { GameMode } from '@common/enums/game-mode.enum';
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
            size: MapSize.SMALL,
            mode: GameMode.CLASSIC,
            lastModified: '2023-01-01',
            visibility: true,
            gridPreviewUrl: '/assets/game1.png',
            draft: false,
        },
        {
            id: '2',
            name: 'Game 2',
            description: 'Desc 2',
            size: MapSize.MEDIUM,
            mode: GameMode.CLASSIC,
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
            const gameDisplays = service['_gameDisplays'];
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
            expect(management.every((game) => !game.draft)).toBeTrue();
            expect(management).toEqual([mixed[0]]);
        });
    });

    describe('loadGames', () => {
        it('should load games and update signal', () => {
            gameHttpServiceSpy.getGamesDisplay.and.returnValue(of(mockGames));

            service.loadGames().subscribe();

            expect(gameHttpServiceSpy.getGamesDisplay).toHaveBeenCalled();
            expect(service['_gameDisplays']()).toEqual(mockGames);
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
            const payload: CreateGameDto = { name: 'C1', description: 'd', size: MapSize.SMALL, mode: 'classic' } as CreateGameDto;
            gameHttpServiceSpy.createGame.and.returnValue(of(mockGames[0]));

            service.createGame(payload).subscribe((res) => {
                expect(res).toBe(mockGames[0]);
            });

            expect(gameHttpServiceSpy.createGame).toHaveBeenCalledWith(payload);
        });
    });

    describe('classicGames', () => {
        beforeEach(() => {
            const mixedGames: GamePreviewDto[] = [
                {
                    id: '1',
                    name: 'Classic Game',
                    description: 'Classic Desc',
                    size: MapSize.SMALL,
                    mode: GameMode.CLASSIC,
                    lastModified: '2023-01-01',
                    visibility: true,
                    gridPreviewUrl: '/assets/classic.png',
                    draft: false,
                },
                {
                    id: '2',
                    name: 'CTF Game',
                    description: 'CTF Desc',
                    size: MapSize.MEDIUM,
                    mode: GameMode.CTF,
                    lastModified: '2023-01-02',
                    visibility: true,
                    gridPreviewUrl: '/assets/ctf.png',
                    draft: false,
                },
            ];
            gameHttpServiceSpy.getGamesDisplay.and.returnValue(of(mixedGames));
            service.loadGames().subscribe();
        });

        it('should return only classic games from visible games', () => {
            const classicGames = service.classicGames();
            expect(classicGames.length).toBe(1);
            expect(classicGames[0].mode).toBe(GameMode.CLASSIC);
            expect(classicGames[0].id).toBe('1');
        });
    });

    describe('ctfGames', () => {
        beforeEach(() => {
            const mixedGames: GamePreviewDto[] = [
                {
                    id: '1',
                    name: 'Classic Game',
                    description: 'Classic Desc',
                    size: MapSize.SMALL,
                    mode: GameMode.CLASSIC,
                    lastModified: '2023-01-01',
                    visibility: true,
                    gridPreviewUrl: '/assets/classic.png',
                    draft: false,
                },
                {
                    id: '2',
                    name: 'CTF Game',
                    description: 'CTF Desc',
                    size: MapSize.MEDIUM,
                    mode: GameMode.CTF,
                    lastModified: '2023-01-02',
                    visibility: true,
                    gridPreviewUrl: '/assets/ctf.png',
                    draft: false,
                },
            ];
            gameHttpServiceSpy.getGamesDisplay.and.returnValue(of(mixedGames));
            service.loadGames().subscribe();
        });

        it('should return only ctf games from visible games', () => {
            const ctfGames = service.ctfGames();
            expect(ctfGames.length).toBe(1);
            expect(ctfGames[0].mode).toBe(GameMode.CTF);
            expect(ctfGames[0].id).toBe('2');
        });
    });

    describe('setActiveTab', () => {
        it('should set active tab to classic', () => {
            const MOCK_TAB: GameTab = 'classic';
            service.setActiveTab(MOCK_TAB);
            expect(service.activeTab()).toBe(MOCK_TAB);
        });

        it('should set active tab to ctf', () => {
            const MOCK_TAB: GameTab = 'ctf';
            service.setActiveTab(MOCK_TAB);
            expect(service.activeTab()).toBe(MOCK_TAB);
        });

        it('should set active tab to all', () => {
            const MOCK_TAB: GameTab = 'all';
            service.setActiveTab(MOCK_TAB);
            expect(service.activeTab()).toBe(MOCK_TAB);
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
                mode: GameMode.CLASSIC,
                lastModified: '2023-01-03',
                visibility: true,
                gridPreviewUrl: '/assets/game3.png',
                draft: false,
            };
            const callback = gameStoreSocketServiceSpy.onGameCreated.calls.argsFor(0)[0];

            callback(newGame);

            expect(service['_gameDisplays']()).toContain(newGame);
        });

        it('should handle game updated event', () => {
            const updatedGame: GamePreviewDto = { ...mockGames[0], name: 'Updated Game 1' };
            const callback = gameStoreSocketServiceSpy.onGameUpdated.calls.argsFor(0)[0];

            callback(updatedGame);

            expect(service['_gameDisplays']()[0].name).toBe('Updated Game 1');
        });

        it('should add updated game when it does not exist (replace branch else)', () => {
            const newGame: GamePreviewDto = {
                id: 'new-99',
                name: 'Brand New',
                description: 'new',
                size: MapSize.MEDIUM,
                mode: GameMode.CLASSIC,
                lastModified: '2023-01-04',
                visibility: true,
                gridPreviewUrl: '/assets/new.png',
                draft: false,
            };

            const callback = gameStoreSocketServiceSpy.onGameUpdated.calls.argsFor(0)[0];

            callback(newGame);

            expect(service['_gameDisplays']().some((game) => game.id === newGame.id)).toBeTrue();
        });

        it('should handle game deleted event', () => {
            const callback = gameStoreSocketServiceSpy.onGameDeleted.calls.argsFor(0)[0];

            callback({ id: '1' });

            expect(service['_gameDisplays']().find((game) => game.id === '1')).toBeUndefined();
        });

        it('should handle game visibility toggled event', () => {
            const callback = gameStoreSocketServiceSpy.onGameVisibilityToggled.calls.argsFor(0)[0];

            callback({ id: '1' });

            expect(service['_gameDisplays']()[0].visibility).toBe(false);
        });
    });
});
