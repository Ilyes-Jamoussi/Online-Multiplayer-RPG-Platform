import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { GamePreviewDto } from '@app/dto/gamePreviewDto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { of } from 'rxjs';
import { GameSessionCreationPageComponent } from './game-session-creation-page.component';

describe('GameSessionCreationPageComponent', () => {
    let component: GameSessionCreationPageComponent;
    let fixture: ComponentFixture<GameSessionCreationPageComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameStoreServiceSpy: jasmine.SpyObj<GameStoreService>;

    const mockGames: GamePreviewDto[] = [
        {
            id: '1',
            name: 'Game 1',
            description: 'Description 1',
            size: 10,
            mode: 'classic',
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
            imports: [GameSessionCreationPageComponent],
            providers: [
                { provide: Router, useValue: routerSpyObj },
                { provide: GameStoreService, useValue: gameStoreServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameSessionCreationPageComponent);
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
        component.onBackClick();

        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.home]);
    });

    it('should navigate to character creation', () => {
        component.onStartGame();

        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.characterCreation]);
    });
});
