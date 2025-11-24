import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TurnTimerComponent } from '@app/components/features/turn-timer/turn-timer.component';
import { InGameService } from '@app/services/in-game/in-game.service';
import { GameMapHeaderComponent } from './game-map-header.component';

const MOCK_TURN_NUMBER = 5;

type MockInGameService = Partial<InGameService> & {
    _turnNumberSignal: WritableSignal<number>;
    _isMyTurnSignal: WritableSignal<boolean>;
    _isGameStartedSignal: WritableSignal<boolean>;
};

describe('GameMapHeaderComponent', () => {
    let component: GameMapHeaderComponent;
    let fixture: ComponentFixture<GameMapHeaderComponent>;
    let mockInGameService: MockInGameService;

    beforeEach(async () => {
        const turnNumberSignal = signal(MOCK_TURN_NUMBER);
        const isMyTurnSignal = signal(true);
        const isGameStartedSignal = signal(false);

        mockInGameService = {
            turnNumber: turnNumberSignal.asReadonly(),
            isMyTurn: isMyTurnSignal.asReadonly(),
            isGameStarted: isGameStartedSignal.asReadonly(),
            endTurn: jasmine.createSpy('endTurn'),
            _turnNumberSignal: turnNumberSignal,
            _isMyTurnSignal: isMyTurnSignal,
            _isGameStartedSignal: isGameStartedSignal,
        };

        await TestBed.configureTestingModule({
            imports: [GameMapHeaderComponent, TurnTimerComponent],
            providers: [{ provide: InGameService, useValue: mockInGameService }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapHeaderComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getters', () => {
        it('should return correct values from inGameService', () => {
            expect(component.turnNumber).toBe(MOCK_TURN_NUMBER);
            expect(component.isMyTurn).toBe(true);
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
            expect(turnElement.textContent.trim()).toBe(MOCK_TURN_NUMBER.toString());
        });

        it('should handle end turn button states correctly', () => {
            mockInGameService._isGameStartedSignal.set(true);
            mockInGameService._isMyTurnSignal.set(true);
            fixture.detectChanges();

            const endButton = fixture.nativeElement.querySelector('.end-turn-btn');
            expect(endButton.disabled).toBe(false);

            mockInGameService._isGameStartedSignal.set(false);
            fixture.detectChanges();
            expect(endButton.disabled).toBe(true);

            mockInGameService._isGameStartedSignal.set(true);
            mockInGameService._isMyTurnSignal.set(false);
            fixture.detectChanges();
            expect(endButton.disabled).toBe(true);
        });

        it('should call onEndTurn when end turn button is clicked', () => {
            spyOn(component, 'onEndTurn');
            mockInGameService._isGameStartedSignal.set(true);
            mockInGameService._isMyTurnSignal.set(true);
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
