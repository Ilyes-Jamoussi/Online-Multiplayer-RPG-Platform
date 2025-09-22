import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
import { ROUTES } from '@app/constants/routes.constants';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { GamePreviewCardComponent } from '@app/shared/components/game-preview-card/game-preview-card.component';
import { of } from 'rxjs';
import { GameManagementPageComponent } from './game-management-page.component';

describe('GameManagementPageComponent', () => {
    let component: GameManagementPageComponent;
    let fixture: ComponentFixture<GameManagementPageComponent>;
    let gameStoreServiceSpy: jasmine.SpyObj<GameStoreService>;
    let routerSpy: jasmine.SpyObj<Router>;

    const mockGames: GamePreviewDto[] = [
        {
            id: '1',
            name: 'Game 1',
            description: 'Description 1',
            size: GamePreviewDto.SizeEnum.NUMBER_10,
            mode: GamePreviewDto.ModeEnum.Classic,
            lastModified: new Date().toISOString(),
            visibility: true,
            gridPreviewUrl: '/assets/game1-preview.png',
        },
        {
            id: '2',
            name: 'Game 2',
            description: 'Description 2',
            size: GamePreviewDto.SizeEnum.NUMBER_15,
            mode: GamePreviewDto.ModeEnum.Classic,
            lastModified: new Date().toISOString(),
            visibility: false,
            gridPreviewUrl: '/assets/game2-preview.png',
        },
    ];

    beforeEach(async () => {
        gameStoreServiceSpy = jasmine.createSpyObj('GameStoreService', ['loadGames', 'deleteGame', 'toggleGameVisibility'], {
            gameDisplays: signal(mockGames),
        });
        gameStoreServiceSpy.loadGames.and.returnValue(of(mockGames));
        gameStoreServiceSpy.deleteGame.and.returnValue(of(undefined));
        gameStoreServiceSpy.toggleGameVisibility.and.returnValue(of(undefined));

        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [GameManagementPageComponent, GamePreviewCardComponent],
            providers: [
                { provide: GameStoreService, useValue: gameStoreServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameManagementPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load games on init', () => {
        expect(gameStoreServiceSpy.loadGames).toHaveBeenCalled();
    });

    it('should return games from service', () => {
        expect(component.gameDisplays()).toEqual(mockGames);
    });

    it('should navigate to game size selection on create new game', () => {
        component.onCreateNewGame();
        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.gameParameters]);
    });

    it('should navigate to game editor on edit game', () => {
        component.onEditGame('id');
        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.gameEditor + '/id']);
    });

    it('should delete game', () => {
        const gameId = '1';
        component.onDeleteGame(gameId);
        expect(gameStoreServiceSpy.deleteGame).toHaveBeenCalledWith(gameId);
    });

    it('should toggle game visibility', () => {
        const gameId = '1';
        component.onToggleVisibility(gameId);
        expect(gameStoreServiceSpy.toggleGameVisibility).toHaveBeenCalledWith(gameId);
    });

    it('should navigate to home on go back', () => {
        component.goBack();
        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.home]);
    });
});
