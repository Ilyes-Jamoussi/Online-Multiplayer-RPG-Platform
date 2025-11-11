import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameStatisticsPageComponent } from './game-statistics-page.component';

describe('GameStatisticsPageComponent', () => {
    let component: GameStatisticsPageComponent;
    let fixture: ComponentFixture<GameStatisticsPageComponent>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [GameStatisticsPageComponent],
            providers: [{ provide: Router, useValue: mockRouter }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameStatisticsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to home page on back click', () => {
        component.onBackClick();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
});
