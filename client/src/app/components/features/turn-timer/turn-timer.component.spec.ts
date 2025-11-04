import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CombatService } from '@app/services/combat/combat.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { TurnTimerComponent } from './turn-timer.component';

describe('TurnTimerComponent', () => {
    let component: TurnTimerComponent;
    let fixture: ComponentFixture<TurnTimerComponent>;
    let mockInGameService: any;
    let mockTimerCoordinatorService: jasmine.SpyObj<TimerCoordinatorService>;
    let mockCombatService: jasmine.SpyObj<CombatService>;
    let timeRemainingSignal: any;
    let isMyTurnSignal: any;
    let isTransitioningSignal: any;
    let isGameStartedSignal: any;

    beforeEach(async () => {
        timeRemainingSignal = signal(25);
        isMyTurnSignal = signal(true);
        isTransitioningSignal = signal(false);
        isGameStartedSignal = signal(true);

        mockInGameService = {
            timeRemaining: timeRemainingSignal,
            isMyTurn: isMyTurnSignal,
            isTransitioning: isTransitioningSignal,
            isGameStarted: isGameStartedSignal
        };

        mockTimerCoordinatorService = jasmine.createSpyObj('TimerCoordinatorService', [
            'getPausedTurnTime',
            'isTurnActive'
        ]);
        mockTimerCoordinatorService.getPausedTurnTime.and.returnValue(15);
        mockTimerCoordinatorService.isTurnActive.and.returnValue(true);

        mockCombatService = jasmine.createSpyObj('CombatService', ['isCombatActive']);
        mockCombatService.isCombatActive.and.returnValue(false);

        await TestBed.configureTestingModule({
            imports: [TurnTimerComponent],
            providers: [
                { provide: InGameService, useValue: mockInGameService },
                { provide: TimerCoordinatorService, useValue: mockTimerCoordinatorService },
                { provide: CombatService, useValue: mockCombatService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TurnTimerComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getters', () => {
        it('should return timeRemaining signal from inGameService', () => {
            expect(component.timeRemaining()).toBe(25);
        });

        it('should return isMyTurn signal from inGameService', () => {
            expect(component.isMyTurn()).toBe(true);
        });

        it('should return isTransitioning signal from inGameService', () => {
            expect(component.isTransitioning()).toBe(false);
        });

        it('should return isGameStarted signal from inGameService', () => {
            expect(component.isGameStarted()).toBe(true);
        });

        it('should return isCombatActive from combatService', () => {
            expect(component.isCombatActive).toBe(false);
            expect(mockCombatService.isCombatActive).toHaveBeenCalled();
        });
    });

    describe('displayedTime', () => {
        it('should return paused turn time when combat is active', () => {
            mockCombatService.isCombatActive.and.returnValue(true);

            expect(component.displayedTime).toBe(15);
            expect(mockTimerCoordinatorService.getPausedTurnTime).toHaveBeenCalled();
        });

        it('should return timeRemaining when combat is not active', () => {
            mockCombatService.isCombatActive.and.returnValue(false);

            expect(component.displayedTime).toBe(25);
        });
    });

    describe('timerLabel', () => {
        it('should return "Combat en cours" when combat is active', () => {
            mockCombatService.isCombatActive.and.returnValue(true);

            expect(component.timerLabel).toBe('Combat en cours');
        });

        it('should return "Transition" when transitioning', () => {
            mockCombatService.isCombatActive.and.returnValue(false);
            isTransitioningSignal.set(true);

            expect(component.timerLabel).toBe('Transition');
        });

        it('should return "Votre tour" when it is my turn', () => {
            mockCombatService.isCombatActive.and.returnValue(false);
            isTransitioningSignal.set(false);
            isMyTurnSignal.set(true);

            expect(component.timerLabel).toBe('Votre tour');
        });

        it('should return "Tour adverse" when it is not my turn', () => {
            mockCombatService.isCombatActive.and.returnValue(false);
            isTransitioningSignal.set(false);
            isMyTurnSignal.set(false);

            expect(component.timerLabel).toBe('Tour adverse');
        });
    });

    describe('timerClass', () => {
        it('should return "combat-active" when combat is active', () => {
            mockCombatService.isCombatActive.and.returnValue(true);

            expect(component.timerClass).toBe('combat-active');
        });

        it('should return "transition" when transitioning', () => {
            mockCombatService.isCombatActive.and.returnValue(false);
            isTransitioningSignal.set(true);

            expect(component.timerClass).toBe('transition');
        });

        it('should return "my-turn" when it is my turn', () => {
            mockCombatService.isCombatActive.and.returnValue(false);
            isTransitioningSignal.set(false);
            isMyTurnSignal.set(true);

            expect(component.timerClass).toBe('my-turn');
        });

        it('should return "other-turn" when it is not my turn', () => {
            mockCombatService.isCombatActive.and.returnValue(false);
            isTransitioningSignal.set(false);
            isMyTurnSignal.set(false);

            expect(component.timerClass).toBe('other-turn');
        });
    });

    describe('shouldShowTimer', () => {
        it('should return true when game is started and turn is active', () => {
            isGameStartedSignal.set(true);
            mockTimerCoordinatorService.isTurnActive.and.returnValue(true);
            mockCombatService.isCombatActive.and.returnValue(false);

            expect(component.shouldShowTimer).toBe(true);
        });

        it('should return true when game is started and combat is active', () => {
            isGameStartedSignal.set(true);
            mockTimerCoordinatorService.isTurnActive.and.returnValue(false);
            mockCombatService.isCombatActive.and.returnValue(true);

            expect(component.shouldShowTimer).toBe(true);
        });

        it('should return false when game is not started', () => {
            isGameStartedSignal.set(false);
            mockTimerCoordinatorService.isTurnActive.and.returnValue(true);
            mockCombatService.isCombatActive.and.returnValue(false);

            expect(component.shouldShowTimer).toBe(false);
        });

        it('should return false when turn is not active and combat is not active', () => {
            isGameStartedSignal.set(true);
            mockTimerCoordinatorService.isTurnActive.and.returnValue(false);
            mockCombatService.isCombatActive.and.returnValue(false);

            expect(component.shouldShowTimer).toBe(false);
        });
    });

    describe('template rendering', () => {
        it('should display timer when shouldShowTimer is true', () => {
            isGameStartedSignal.set(true);
            mockTimerCoordinatorService.isTurnActive.and.returnValue(true);
            
            fixture.detectChanges();

            const timerElement = fixture.nativeElement.querySelector('.turn-timer');
            expect(timerElement).toBeTruthy();
        });

        it('should not display timer when shouldShowTimer is false', () => {
            isGameStartedSignal.set(false);
            mockTimerCoordinatorService.isTurnActive.and.returnValue(false);
            
            fixture.detectChanges();

            const timerElement = fixture.nativeElement.querySelector('.turn-timer');
            expect(timerElement).toBeFalsy();
        });

        it('should display correct timer label and time', () => {
            isGameStartedSignal.set(true);
            mockTimerCoordinatorService.isTurnActive.and.returnValue(true);
            isMyTurnSignal.set(true);
            
            fixture.detectChanges();

            const labelElement = fixture.nativeElement.querySelector('.timer-label');
            const timeElement = fixture.nativeElement.querySelector('.time-value');
            
            expect(labelElement.textContent).toBe('Votre tour');
            expect(timeElement.textContent).toBe('25');
        });

        it('should apply correct CSS class', () => {
            isGameStartedSignal.set(true);
            mockTimerCoordinatorService.isTurnActive.and.returnValue(true);
            isMyTurnSignal.set(true);
            
            fixture.detectChanges();

            const timerElement = fixture.nativeElement.querySelector('.turn-timer');
            expect(timerElement.classList.contains('my-turn')).toBe(true);
        });
    });
});