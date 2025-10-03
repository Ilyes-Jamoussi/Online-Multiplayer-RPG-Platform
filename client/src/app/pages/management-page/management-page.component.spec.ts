import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GamePreviewCardComponent } from '@app/components/features/game-preview-card/game-preview-card.component';
import { ROUTES } from '@app/constants/routes.constants';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { of } from 'rxjs';
import { ManagementPageComponent } from './management-page.component';

describe('ManagementPageComponent', () => {
    let component: ManagementPageComponent;
    let fixture: ComponentFixture<ManagementPageComponent>;
    let gameStoreServiceSpy: jasmine.SpyObj<GameStoreService>;
    let routerSpy: jasmine.SpyObj<Router>;

    const mockGames: GamePreviewDto[] = [
        {
            id: '1',
            name: 'Game 1',
            description: 'Description 1',
            size: MapSize.SMALL,
            mode: GameMode.CLASSIC,
            lastModified: new Date().toISOString(),
            visibility: true,
            gridPreviewUrl: '/assets/game1-preview.png',
            draft: false,
        },
        {
            id: '2',
            name: 'Game 2',
            description: 'Description 2',
            size: MapSize.MEDIUM,
            mode: GameMode.CLASSIC,
            lastModified: new Date().toISOString(),
            visibility: false,
            gridPreviewUrl: '/assets/game2-preview.png',
            draft: false,
        },
    ];

    beforeEach(async () => {
        gameStoreServiceSpy = jasmine.createSpyObj('GameStoreService', ['loadGames', 'deleteGame', 'toggleGameVisibility'], {
            managementGames: signal(mockGames),
        });
        gameStoreServiceSpy.loadGames.and.returnValue(of(mockGames));
        gameStoreServiceSpy.deleteGame.and.returnValue(of(undefined));
        gameStoreServiceSpy.toggleGameVisibility.and.returnValue(of(undefined));

        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [ManagementPageComponent, GamePreviewCardComponent],
            providers: [
                { provide: GameStoreService, useValue: gameStoreServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ManagementPageComponent);
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
        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.gameEditor, 'id']);
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
        component.onBack();
        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.home]);
    });
});
