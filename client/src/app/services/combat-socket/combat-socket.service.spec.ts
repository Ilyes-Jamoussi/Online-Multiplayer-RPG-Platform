import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/socket/socket.service';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { CombatSocketService } from './combat-socket.service';

describe('CombatSocketService', () => {
    let service: CombatSocketService;
    let mockSocketService: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        mockSocketService = jasmine.createSpyObj('SocketService', ['emit', 'onSuccessEvent']);

        TestBed.configureTestingModule({
            providers: [
                { provide: SocketService, useValue: mockSocketService }
            ]
        });
        service = TestBed.inject(CombatSocketService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('emit methods', () => {
        it('should emit attackPlayerAction', () => {
            const sessionId = 'session-1';
            const x = 5;
            const y = 3;

            service.attackPlayerAction({ sessionId, x, y });

            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.AttackPlayerAction, { sessionId, x, y });
        });

        it('should emit combatChoice', () => {
            const sessionId = 'session-1';
            const choice = CombatPosture.OFFENSIVE;

            service.combatChoice({ sessionId, choice });

            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.CombatChoice, { sessionId, choice });
        });

        it('should emit combatAbandon', () => {
            const sessionId = 'session-1';

            service.combatAbandon({ sessionId });

            expect(mockSocketService.emit).toHaveBeenCalledWith(InGameEvents.CombatAbandon, { sessionId });
        });
    });

    describe('event listeners', () => {
        it('should register onCombatStarted listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatStarted(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatStarted, callback);
        });

        it('should register onCombatEnded listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatEnded(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatEnded, callback);
        });

        it('should register onPlayerCombatResult listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onPlayerCombatResult(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerCombatResult, callback);
        });

        it('should register onCombatNewRoundStarted listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatNewRoundStarted(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatNewRoundStarted, callback);
        });

        it('should register onPlayerHealthChanged listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onPlayerHealthChanged(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.PlayerHealthChanged, callback);
        });

        it('should register onCombatTimerRestart listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatTimerRestart(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatTimerRestart, callback);
        });

        it('should register onCombatPostureSelected listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatPostureSelected(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatPostureSelected, callback);
        });

        it('should register onCombatVictory listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatVictory(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatVictory, callback);
        });

        it('should register onCombatCountChanged listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatCountChanged(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatCountChanged, callback);
        });

        it('should register onCombatWinsChanged listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatWinsChanged(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatWinsChanged, callback);
        });

        it('should register onCombatLossesChanged listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatLossesChanged(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatLossesChanged, callback);
        });

        it('should register onCombatDrawsChanged listener', () => {
            const callback = jasmine.createSpy('callback');

            service.onCombatDrawsChanged(callback);

            expect(mockSocketService.onSuccessEvent).toHaveBeenCalledWith(InGameEvents.CombatDrawsChanged, callback);
        });
    });
});