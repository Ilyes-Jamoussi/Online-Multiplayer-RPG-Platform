import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { of } from 'rxjs';
import { SessionCreationPageComponent } from './session-creation-page.component';

describe('SessionCreationPageComponent', () => {
    let component: SessionCreationPageComponent;
    let fixture: ComponentFixture<SessionCreationPageComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameStoreServiceSpy: jasmine.SpyObj<GameStoreService>;

    const mockGames: GamePreviewDto[] = [
        {
            id: '1',
            name: 'Game 1',
            description: 'Description 1',
            size: 10,
            mode: GameMode.CLASSIC,
            lastModified: new Date().toISOString(),
            visibility: true,
            gridPreviewUrl: '/assets/game1-preview.png',
            draft: false,
        },
    ];

    beforeEach(async () => {
        gameStoreServiceSpy = jasmine.createSpyObj('GameStoreService', ['loadGames'], {
            visibleGames: signal(mockGames),
        });
        const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [SessionCreationPageComponent],
            providers: [
                { provide: Router, useValue: routerSpyObj },
                { provide: GameStoreService, useValue: gameStoreServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SessionCreationPageComponent);
        component = fixture.componentInstance;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        gameStoreServiceSpy.loadGames.and.returnValue(of(mockGames));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load games on init', () => {
        expect(gameStoreServiceSpy.loadGames).toHaveBeenCalled();
    });

    it('should return visible game displays', () => {
        const signalRef = component.visibleGameDisplays;
        expect(signalRef).toBe(gameStoreServiceSpy.visibleGames);
        expect(signalRef()).toEqual(mockGames);
    });

    it('should navigate back to home when back is clicked', () => {
        component.onBack();

        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.HomePage]);
    });

    it('should navigate to character creation', () => {
        const mockGame = { id: 'test-game', name: 'Test Game' } as GamePreviewDto;
        component.onStartGame(mockGame);

        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.CharacterCreationPage]);
    });
});
