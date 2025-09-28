import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { GamePreviewDto } from '@app/dto/gamePreviewDto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { MAP_SIZE_LABELS } from '@common/constants/game.constants';
import { MapSize } from '@common/enums/map-size.enum';
import { environment } from '@src/environments/environment';
import { GamePreviewCardComponent } from './game-preview-card.component';

describe('GamePreviewCardComponent', () => {
    let component: GamePreviewCardComponent;
    let fixture: ComponentFixture<GamePreviewCardComponent>;

    const mockGame: GamePreviewDto = {
        id: '1',
        name: 'Test Game',
        description: 'Test Description',
        size: 10,
        mode: 'classic',
        lastModified: '2023-01-01T10:00:00Z',
        visibility: true,
        gridPreviewUrl: '/assets/test-game.png',
        draft: false,
    };

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const gameStoreSpy = jasmine.createSpyObj('GameStoreService', ['setGameId', 'setName', 'setDescription']);

        await TestBed.configureTestingModule({
            imports: [GamePreviewCardComponent],
            providers: [provideHttpClientTesting(), { provide: Router, useValue: routerSpy }, { provide: GameStoreService, useValue: gameStoreSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePreviewCardComponent);
        component = fixture.componentInstance;
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

    it('should navigate to game editor on edit', () => {
        const router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        component.onEditGame();

        expect(router.navigate).toHaveBeenCalledWith([ROUTES.gameEditor, mockGame.id]);
    });

    it('should build image url from environment socketUrl and game preview path', () => {
        const expected = `${environment.socketUrl}${mockGame.gridPreviewUrl}`;
        expect(component.getImageUrl()).toBe(expected);
    });

    it('should return a map size label when available and fallback to NxN when missing', () => {
        const labels = MAP_SIZE_LABELS as Record<string, string>;
        const knownKey = Object.keys(labels).find((k) => labels[k] && labels[k].length > 0);
        if (knownKey) {
            const keyAsNumber = Number(knownKey) as unknown as MapSize;
            component.game.size = keyAsNumber;
            expect(component.getMapSizeLabel()).toBe(labels[knownKey]);
        }

        let candidate = MapSize.SMALL as number;
        while (labels[candidate as unknown as string as keyof typeof labels]) candidate += 1;
        component.game.size = candidate as unknown as MapSize;
        expect(component.getMapSizeLabel()).toBe(`${candidate}x${candidate}`);
    });
});
