import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { InGameService } from '@app/services/in-game/in-game.service';
import { TurnTimerComponent } from '@app/components/features/turn-timer/turn-timer.component';
import { GameMapHeaderComponent } from './game-map-header.component';

describe('GameMapHeaderComponent', () => {
    let component: GameMapHeaderComponent;
    let fixture: ComponentFixture<GameMapHeaderComponent>;
    let mockInGameService: any;

    beforeEach(async () => {
        mockInGameService = {
            turnNumber: signal(5),
            isMyTurn: signal(true),
            isGameStarted: signal(false),
            startGame: jasmine.createSpy('startGame'),
            endTurn: jasmine.createSpy('endTurn')
        };

        await TestBed.configureTestingModule({
            imports: [GameMapHeaderComponent, TurnTimerComponent],
            providers: [
                { provide: InGameService, useValue: mockInGameService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapHeaderComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getters', () => {
        it('should return turnNumber from inGameService', () => {
            expect(component.turnNumber).toBe(5);
        });

        it('should return isMyTurn from inGameService', () => {
            expect(component.isMyTurn).toBe(true);
        });

        it('should return isGameStarted from inGameService', () => {
            expect(component.isGameStarted).toBe(false);
        });
    });

    describe('actions', () => {


        it('should call endTurn on inGameService', () => {
            component.onEndTurn();

            expect(mockInGameService.endTurn).toHaveBeenCalled();
        });
    });

    describe('template rendering', () => {
        it('should display turn number', () => {
            fixture.detectChanges();

            const turnElement = fixture.nativeElement.querySelector('.header-value');
            expect(turnElement.textContent.trim()).toBe('5');
        });



        it('should enable end turn button when game started and is my turn', () => {
            mockInGameService.isGameStarted = signal(true);
            mockInGameService.isMyTurn = signal(true);
            fixture.detectChanges();

            const endButton = fixture.nativeElement.querySelector('.end-turn-btn');
            expect(endButton.disabled).toBe(false);
        });

        it('should disable end turn button when game not started', () => {
            mockInGameService.isGameStarted = signal(false);
            mockInGameService.isMyTurn = signal(true);
            fixture.detectChanges();

            const endButton = fixture.nativeElement.querySelector('.end-turn-btn');
            expect(endButton.disabled).toBe(true);
        });

        it('should disable end turn button when not my turn', () => {
            mockInGameService.isGameStarted = signal(true);
            mockInGameService.isMyTurn = signal(false);
            fixture.detectChanges();

            const endButton = fixture.nativeElement.querySelector('.end-turn-btn');
            expect(endButton.disabled).toBe(true);
        });



        it('should call onEndTurn when end turn button is clicked', () => {
            spyOn(component, 'onEndTurn');
            mockInGameService.isGameStarted = signal(true);
            mockInGameService.isMyTurn = signal(true);
            fixture.detectChanges();

            const endButton = fixture.nativeElement.querySelector('.end-turn-btn');
            endButton.click();

            expect(component.onEndTurn).toHaveBeenCalled();
        });

        it('should render turn timer component', () => {
            fixture.detectChanges();

            const timerComponent = fixture.nativeElement.querySelector('app-turn-timer');
            expect(timerComponent).toBeTruthy();
        });
    });
});