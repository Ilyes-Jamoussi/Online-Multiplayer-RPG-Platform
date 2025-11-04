import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CombatService } from '@app/services/combat/combat.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { CombatTimerComponent } from './combat-timer.component';

describe('CombatTimerComponent', () => {
    let component: CombatTimerComponent;
    let fixture: ComponentFixture<CombatTimerComponent>;
    let mockCombatService: any;
    let mockTimerCoordinatorService: any;
    let combatTimeRemainingSignal: any;
    let combatDataSignal: any;

    beforeEach(async () => {
        combatTimeRemainingSignal = signal(3);
        combatDataSignal = signal({ attackerId: 'player1', targetId: 'player2', userRole: 'attacker' });

        mockCombatService = {
            combatData: combatDataSignal
        };

        mockTimerCoordinatorService = {
            combatTimeRemaining: combatTimeRemainingSignal
        };

        await TestBed.configureTestingModule({
            imports: [CombatTimerComponent],
            providers: [
                { provide: CombatService, useValue: mockCombatService },
                { provide: TimerCoordinatorService, useValue: mockTimerCoordinatorService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CombatTimerComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getters', () => {
        it('should return timeRemaining signal from timerCoordinatorService', () => {
            expect(component.timeRemaining()).toBe(3);
        });

        it('should return "Combat" as timer label', () => {
            expect(component.timerLabel).toBe('Combat');
        });

        it('should return true for shouldShowTimer when combat data exists', () => {
            expect(component.shouldShowTimer).toBe(true);
        });

        it('should return false for shouldShowTimer when combat data is null', () => {
            combatDataSignal.set(null);

            expect(component.shouldShowTimer).toBe(false);
        });
    });

    describe('template rendering', () => {
        it('should display timer when shouldShowTimer is true', () => {
            fixture.detectChanges();

            const timerElement = fixture.nativeElement.querySelector('.combat-timer');
            expect(timerElement).toBeTruthy();
        });

        it('should not display timer when shouldShowTimer is false', () => {
            combatDataSignal.set(null);
            fixture.detectChanges();

            const timerElement = fixture.nativeElement.querySelector('.combat-timer');
            expect(timerElement).toBeFalsy();
        });

        it('should display correct timer label and time', () => {
            fixture.detectChanges();

            const labelElement = fixture.nativeElement.querySelector('.timer-label');
            const timeElement = fixture.nativeElement.querySelector('.time-value');

            expect(labelElement.textContent).toBe('Combat');
            expect(timeElement.textContent).toBe('3');
        });

        it('should display time unit', () => {
            fixture.detectChanges();

            const unitElement = fixture.nativeElement.querySelector('.time-unit');
            expect(unitElement.textContent).toBe('s');
        });

        it('should update progress bar width based on time remaining', () => {
            combatTimeRemainingSignal.set(2);
            fixture.detectChanges();

            const progressElement = fixture.nativeElement.querySelector('.timer-progress');
            expect(progressElement.style.width).toBe('40%'); // (2/5) * 100
        });

        it('should show full progress when time is 5', () => {
            combatTimeRemainingSignal.set(5);
            fixture.detectChanges();

            const progressElement = fixture.nativeElement.querySelector('.timer-progress');
            expect(progressElement.style.width).toBe('100%');
        });

        it('should show no progress when time is 0', () => {
            combatTimeRemainingSignal.set(0);
            fixture.detectChanges();

            const progressElement = fixture.nativeElement.querySelector('.timer-progress');
            expect(progressElement.style.width).toBe('0%');
        });
    });
});