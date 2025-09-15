import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
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
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GamePreviewCardComponent],
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

    it('should emit editGame event with game id', () => {
        spyOn(component.editGame, 'emit');

        component.onEditGame();

        expect(component.editGame.emit).toHaveBeenCalledWith('1');
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
