import { TestBed } from '@angular/core/testing';
import { TimerCoordinatorService } from './timer-coordinator.service';
import { MILLISECONDS_PER_SECOND } from '@common/constants/in-game';
import { COMBAT_ROUND_DURATION_SECONDS } from '@app/constants/combat.constants';

describe('TimerCoordinatorService', () => {
    let service: TimerCoordinatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TimerCoordinatorService);
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Turn Timer', () => {
        it('should start turn timer with correct duration', () => {
            const duration = 5000; // 5 seconds
            service.startTurnTimer(duration);

            expect(service.turnTimeRemaining()).toBe(5);
            expect(service.isTurnActive()).toBe(true);
        });

        it('should decrement turn timer every second', () => {
            service.startTurnTimer(3000);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.turnTimeRemaining()).toBe(2);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.turnTimeRemaining()).toBe(1);
        });

        it('should stop turn timer when reaching 1 second', () => {
            service.startTurnTimer(2000);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.isTurnActive()).toBe(true);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
        });

        it('should stop turn timer manually', () => {
            service.startTurnTimer(5000);
            expect(service.isTurnActive()).toBe(true);

            service.stopTurnTimer();
            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
            expect(service.getPausedTurnTime()).toBe(0);
        });

        it('should pause turn timer and save remaining time', () => {
            service.startTurnTimer(5000);
            jasmine.clock().tick(MILLISECONDS_PER_SECOND);

            service.pauseTurnTimer();
            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
            expect(service.getPausedTurnTime()).toBe(3);
        });

        it('should resume turn timer from paused time', () => {
            service.startTurnTimer(5000);
            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            service.pauseTurnTimer();

            service.resumeTurnTimer();
            expect(service.isTurnActive()).toBe(true);
            expect(service.turnTimeRemaining()).toBe(3);
            expect(service.getPausedTurnTime()).toBe(0);
        });

        it('should not resume if no paused time', () => {
            service.resumeTurnTimer();
            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
        });

        it('should clear existing timer when starting new one', () => {
            service.startTurnTimer(3000);
            const firstTimer = service.turnTimeRemaining();

            service.startTurnTimer(5000);
            expect(service.turnTimeRemaining()).toBe(5);
            expect(service.turnTimeRemaining()).not.toBe(firstTimer);
        });
    });

    describe('Combat Timer', () => {
        it('should start combat timer with default duration', () => {
            service.startCombatTimer();

            expect(service.combatTimeRemaining()).toBe(COMBAT_ROUND_DURATION_SECONDS);
            expect(service.isCombatActive()).toBe(true);
        });

        it('should decrement combat timer every second', () => {
            service.startCombatTimer();

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.combatTimeRemaining()).toBe(COMBAT_ROUND_DURATION_SECONDS - 1);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.combatTimeRemaining()).toBe(COMBAT_ROUND_DURATION_SECONDS - 2);
        });

        it('should reset combat timer when reaching 1 second', () => {
            service.startCombatTimer();

            jasmine.clock().tick((COMBAT_ROUND_DURATION_SECONDS - 1) * MILLISECONDS_PER_SECOND);
            expect(service.combatTimeRemaining()).toBe(1);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.combatTimeRemaining()).toBe(COMBAT_ROUND_DURATION_SECONDS);
            expect(service.isCombatActive()).toBe(true);
        });

        it('should stop combat timer manually', () => {
            service.startCombatTimer();
            expect(service.isCombatActive()).toBe(true);

            service.stopCombatTimer();
            expect(service.isCombatActive()).toBe(false);
            expect(service.combatTimeRemaining()).toBe(0);
        });

        it('should reset combat timer to full duration', () => {
            service.startCombatTimer();
            jasmine.clock().tick(2 * MILLISECONDS_PER_SECOND);

            service.resetCombatTimer();
            expect(service.combatTimeRemaining()).toBe(COMBAT_ROUND_DURATION_SECONDS);
        });

        it('should reset existing combat timer when starting new one', () => {
            service.startCombatTimer();
            jasmine.clock().tick(2 * MILLISECONDS_PER_SECOND);
            expect(service.combatTimeRemaining()).toBe(COMBAT_ROUND_DURATION_SECONDS - 2);

            service.startCombatTimer();
            expect(service.combatTimeRemaining()).toBe(COMBAT_ROUND_DURATION_SECONDS);
        });
    });

    describe('Reset All Timers', () => {
        it('should reset both turn and combat timers', () => {
            service.startTurnTimer(5000);
            service.startCombatTimer();

            expect(service.isTurnActive()).toBe(true);
            expect(service.isCombatActive()).toBe(true);

            service.resetAllTimers();

            expect(service.isTurnActive()).toBe(false);
            expect(service.isCombatActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
            expect(service.combatTimeRemaining()).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle pause when timer is not active', () => {
            service.pauseTurnTimer();
            expect(service.getPausedTurnTime()).toBe(0);
        });

        it('should handle pause when time remaining is 0', () => {
            service.startTurnTimer(1000);
            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            
            service.pauseTurnTimer();
            expect(service.getPausedTurnTime()).toBe(0);
        });

        it('should handle multiple stop calls', () => {
            service.startTurnTimer(3000);
            service.stopTurnTimer();
            service.stopTurnTimer();

            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
        });

        it('should handle multiple combat timer stop calls', () => {
            service.startCombatTimer();
            service.stopCombatTimer();
            service.stopCombatTimer();

            expect(service.isCombatActive()).toBe(false);
            expect(service.combatTimeRemaining()).toBe(0);
        });
    });
});