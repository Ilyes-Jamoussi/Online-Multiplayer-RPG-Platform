import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { COMBAT_ROUND_DURATION_SECONDS } from '@app/constants/combat.constants';
import { MILLISECONDS_PER_SECOND } from '@common/constants/in-game';
import { TimerService } from './timer.service';

const TEST_DURATION_1000 = 1000;
const TEST_DURATION_2000 = 2000;
const TEST_DURATION_3000 = 3000;
const TEST_DURATION_5000 = 5000;
const TEST_SECONDS_3 = 3;
const TEST_SECONDS_5 = 5;
const TEST_SECONDS_8 = 8;
const TEST_SECONDS_9 = 9;
const TEST_SECONDS_10 = 10;

describe('TimerService', () => {
    let service: TimerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TimerService);
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
            const duration = TEST_DURATION_5000;
            service.startTurnTimer(duration);

            expect(service.turnTimeRemaining()).toBe(TEST_SECONDS_5);
            expect(service.isTurnActive()).toBe(true);
        });

        it('should decrement turn timer every second', () => {
            service.startTurnTimer(TEST_DURATION_3000);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.turnTimeRemaining()).toBe(2);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.turnTimeRemaining()).toBe(1);
        });

        it('should stop turn timer when reaching 1 second', () => {
            service.startTurnTimer(TEST_DURATION_2000);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.isTurnActive()).toBe(true);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
        });

        it('should stop turn timer manually', () => {
            service.startTurnTimer(TEST_DURATION_5000);
            expect(service.isTurnActive()).toBe(true);

            service.stopTurnTimer();
            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
            expect(service.getPausedTurnTime()).toBe(0);
        });

        it('should pause turn timer and save remaining time', () => {
            service.startTurnTimer(TEST_DURATION_5000);
            jasmine.clock().tick(MILLISECONDS_PER_SECOND);

            service.pauseTurnTimer();
            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
            expect(service.getPausedTurnTime()).toBe(TEST_SECONDS_3);
        });

        it('should resume turn timer from paused time', () => {
            service.startTurnTimer(TEST_DURATION_5000);
            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            service.pauseTurnTimer();

            service.resumeTurnTimer();
            expect(service.isTurnActive()).toBe(true);
            expect(service.turnTimeRemaining()).toBe(TEST_SECONDS_3);
            expect(service.getPausedTurnTime()).toBe(0);
        });

        it('should decrement turn timer when resumed and running', () => {
            service.startTurnTimer(TEST_DURATION_5000);
            jasmine.clock().tick(2 * MILLISECONDS_PER_SECOND);
            service.pauseTurnTimer();
            expect(service.getPausedTurnTime()).toBe(2);

            service.resumeTurnTimer();
            expect(service.turnTimeRemaining()).toBe(2);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.turnTimeRemaining()).toBe(1);
            expect(service.isTurnActive()).toBe(true);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
        });

        it('should not resume if no paused time', () => {
            service.resumeTurnTimer();
            expect(service.isTurnActive()).toBe(false);
            expect(service.turnTimeRemaining()).toBe(0);
        });

        it('should clear existing timer when starting new one', () => {
            service.startTurnTimer(TEST_DURATION_3000);
            const firstTimer = service.turnTimeRemaining();

            service.startTurnTimer(TEST_DURATION_5000);
            expect(service.turnTimeRemaining()).toBe(TEST_SECONDS_5);
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
            service.startTurnTimer(TEST_DURATION_5000);
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

    describe('Game Over Timer', () => {
        it('should start game over timer with correct duration', () => {
            const mockRouter = { navigate: jasmine.createSpy('navigate') };
            service.startGameOverTimer(mockRouter as unknown as Router);

            expect(service.gameOverTimeRemaining()).toBe(TEST_SECONDS_10);
            expect(service.isGameOverActive()).toBe(true);
        });

        it('should decrement game over timer every second', () => {
            const mockRouter = { navigate: jasmine.createSpy('navigate') };
            service.startGameOverTimer(mockRouter as unknown as Router);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.gameOverTimeRemaining()).toBe(TEST_SECONDS_9);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(service.gameOverTimeRemaining()).toBe(TEST_SECONDS_8);
        });

        it('should navigate to home page when timer reaches 1 second', () => {
            const mockRouter = { navigate: jasmine.createSpy('navigate') };
            service.startGameOverTimer(mockRouter as unknown as Router);

            jasmine.clock().tick(TEST_SECONDS_9 * MILLISECONDS_PER_SECOND);
            expect(service.gameOverTimeRemaining()).toBe(1);

            jasmine.clock().tick(MILLISECONDS_PER_SECOND);
            expect(mockRouter.navigate).toHaveBeenCalledWith(['home']);
            expect(service.isGameOverActive()).toBe(false);
            expect(service.gameOverTimeRemaining()).toBe(0);
        });

        it('should stop game over timer manually', () => {
            const mockRouter = { navigate: jasmine.createSpy('navigate') };
            service.startGameOverTimer(mockRouter as unknown as Router);
            expect(service.isGameOverActive()).toBe(true);

            service.stopGameOverTimer();
            expect(service.isGameOverActive()).toBe(false);
            expect(service.gameOverTimeRemaining()).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle pause when timer is not active', () => {
            service.pauseTurnTimer();
            expect(service.getPausedTurnTime()).toBe(0);
        });

        it('should handle pause when time remaining is 0', () => {
            service.startTurnTimer(TEST_DURATION_1000);
            jasmine.clock().tick(MILLISECONDS_PER_SECOND);

            service.pauseTurnTimer();
            expect(service.getPausedTurnTime()).toBe(0);
        });

        it('should handle multiple stop calls', () => {
            service.startTurnTimer(TEST_DURATION_3000);
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
