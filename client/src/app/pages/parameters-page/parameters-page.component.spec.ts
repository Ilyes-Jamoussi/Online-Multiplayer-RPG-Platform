import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@common/enums/routes.enum';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MAP_SIZE_TO_MAX_PLAYERS, MapSize } from '@common/enums/map-size.enum';
import { of, throwError } from 'rxjs';
import { ParametersPageComponent } from './parameters-page.component';

describe('ParametersPageComponent', () => {
    let component: ParametersPageComponent;
    let fixture: ComponentFixture<ParametersPageComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockGameStoreService: jasmine.SpyObj<GameStoreService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;

    const mockGamePreview: GamePreviewDto = {
        id: 'test-game-id',
        name: 'Test Game',
        size: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        description: 'Test Description',
        lastModified: '2024-01-01T00:00:00Z',
        visibility: false,
        gridPreviewUrl: 'http://example.com/preview.png',
        draft: true,
    };

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockGameStoreService = jasmine.createSpyObj('GameStoreService', ['createGame']);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['displayError']);

        await TestBed.configureTestingModule({
            imports: [ParametersPageComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: Router, useValue: mockRouter },
                { provide: GameStoreService, useValue: mockGameStoreService },
                { provide: NotificationService, useValue: mockNotificationService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ParametersPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default selected values', () => {
        expect(component.selectedMapSize).toBe(MapSize.MEDIUM);
        expect(component.selectedGameMode).toBe(GameMode.CLASSIC);
    });

    it('should have correct mapSizeOptions', () => {
        expect(component.mapSizeOptions).toEqual([
            {
                value: MapSize.SMALL,
                label: `Petite (${MapSize.SMALL}x${MapSize.SMALL})`,
                maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.SMALL],
            },
            {
                value: MapSize.MEDIUM,
                label: `Moyenne (${MapSize.MEDIUM}x${MapSize.MEDIUM})`,
                maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.MEDIUM],
            },
            {
                value: MapSize.LARGE,
                label: `Grande (${MapSize.LARGE}x${MapSize.LARGE})`,
                maxPlayers: MAP_SIZE_TO_MAX_PLAYERS[MapSize.LARGE],
            },
        ]);
    });

    it('should have correct gameModeOptions', () => {
        expect(component.gameModeOptions).toEqual([
            {
                value: GameMode.CLASSIC,
                label: 'Classique',
                description: 'Mode de jeu standard',
            },
            {
                value: GameMode.CTF,
                label: 'Capture du Drapeau',
                description: 'Capturez le drapeau ennemi',
            },
        ]);
    });

    it('should create game successfully and navigate to editor', () => {
        mockGameStoreService.createGame.and.returnValue(of(mockGamePreview));

        component.selectedMapSize = MapSize.LARGE;
        component.selectedGameMode = GameMode.CTF;

        component.onCreate();

        expect(mockGameStoreService.createGame).toHaveBeenCalledWith({
            size: MapSize.LARGE,
            mode: GameMode.CTF,
            name: '',
            description: '',
            visibility: false,
        });
        expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.EditorPage, 'test-game-id']);
    });

    it('should handle create game error with error message', () => {
        const errorResponse = { error: { message: 'Custom error message' } };
        mockGameStoreService.createGame.and.returnValue(throwError(() => errorResponse));

        component.onCreate();

        expect(mockGameStoreService.createGame).toHaveBeenCalled();
        expect(mockNotificationService.displayError).toHaveBeenCalledWith({
            title: 'Erreur lors de la création de la partie',
            message: 'Custom error message',
        });
        expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle create game error without error message', () => {
        const errorResponse = {};
        mockGameStoreService.createGame.and.returnValue(throwError(() => errorResponse));

        component.onCreate();

        expect(mockGameStoreService.createGame).toHaveBeenCalled();
        expect(mockNotificationService.displayError).toHaveBeenCalledWith({
            title: 'Erreur lors de la création de la partie',
            message: 'Une erreur est survenue',
        });
        expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle create game error with null error', () => {
        mockGameStoreService.createGame.and.returnValue(throwError(() => null));

        component.onCreate();

        expect(mockGameStoreService.createGame).toHaveBeenCalled();
        expect(mockNotificationService.displayError).toHaveBeenCalledWith({
            title: 'Erreur lors de la création de la partie',
            message: 'Une erreur est survenue',
        });
        expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should create game with default parameters when onCreate is called', () => {
        mockGameStoreService.createGame.and.returnValue(of(mockGamePreview));

        component.onCreate();

        expect(mockGameStoreService.createGame).toHaveBeenCalledWith({
            size: MapSize.MEDIUM,
            mode: GameMode.CLASSIC,
            name: '',
            description: '',
            visibility: false,
        });
    });
});
