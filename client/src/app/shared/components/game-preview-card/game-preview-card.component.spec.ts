import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
import { ROUTES } from '@app/constants/routes.constants';
import { GameStoreService } from '@app/services/game/game-store/game-store.service';
import { GamePreviewCardComponent } from './game-preview-card.component';

describe('GamePreviewCardComponent', () => {
    let component: GamePreviewCardComponent;
    let fixture: ComponentFixture<GamePreviewCardComponent>;
    let router: jasmine.SpyObj<Router>;
    let gameStoreService: jasmine.SpyObj<GameStoreService>;

    const mockGame: GamePreviewDto = {
        id: '1',
        name: 'Test Game',
        description: 'Test Description',
        size: 10,
        mode: 'classic',
        lastModified: '2023-01-01T10:00:00Z',
        visibility: true,
        gridPreviewUrl: '/assets/test-game.png',
    };

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const gameStoreSpy = jasmine.createSpyObj('GameStoreService', ['setGameId', 'setName', 'setDescription']);

        await TestBed.configureTestingModule({
            imports: [GamePreviewCardComponent, HttpClientTestingModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: GameStoreService, useValue: gameStoreSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePreviewCardComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        gameStoreService = TestBed.inject(GameStoreService) as jasmine.SpyObj<GameStoreService>;
        component.game = mockGame;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit startGame event with game id', () => {
        spyOn(component.startGame, 'emit');

        component.onStartGame();

        expect(component.startGame.emit).toHaveBeenCalledWith('1');
    });

    it('should navigate to game editor and set game data when editing', () => {
        component.onEditGame();

        expect(gameStoreService.setGameId).toHaveBeenCalledWith('1');
        expect(gameStoreService.setName).toHaveBeenCalledWith('Test Game');
        expect(gameStoreService.setDescription).toHaveBeenCalledWith('Test Description');
        expect(router.navigate).toHaveBeenCalledWith([ROUTES.gameEditor]);
    });

    it('should emit deleteGame event with game id', () => {
        spyOn(component.deleteGame, 'emit');

        component.onDeleteGame();

        expect(component.deleteGame.emit).toHaveBeenCalledWith('1');
    });

    it('should emit toggleVisibility event with game id', () => {
        spyOn(component.toggleVisibility, 'emit');

        component.onToggleVisibility();

        expect(component.toggleVisibility.emit).toHaveBeenCalledWith('1');
    });

    it('should format date correctly', () => {
        const dateString = '2023-01-01T10:00:00Z';
        const result = component.formatDate(dateString);

        expect(result).toContain('2023');
        expect(result).toContain('janv.');
        expect(result).toContain('01');
    });

    it('should format Date object correctly', () => {
        const date = new Date('2023-01-01T10:00:00Z');
        const result = component.formatDate(date);

        expect(result).toContain('2023');
        expect(result).toContain('janv.');
        expect(result).toContain('01');
    });

    it('should have isAdmin false by default', () => {
        expect(component.isAdmin).toBe(false);
    });

    it('should accept isAdmin input', () => {
        component.isAdmin = true;
        expect(component.isAdmin).toBe(true);
    });
});
