import { TestBed } from '@angular/core/testing';
import { InGameKeyboardEventsService } from './in-game-keyboard-events.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { Orientation } from '@common/enums/orientation.enum';
import { GameKey } from '@app/enums/game-key.enum';

describe('InGameKeyboardEventsService', () => {
    let service: InGameKeyboardEventsService;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockAdminModeService: jasmine.SpyObj<AdminModeService>;

    beforeEach(() => {
        mockInGameService = jasmine.createSpyObj('InGameService', ['isMyTurn', 'isGameStarted', 'movePlayer']);
        mockAdminModeService = jasmine.createSpyObj('AdminModeService', ['toggleAdminMode']);

        TestBed.configureTestingModule({
            providers: [
                { provide: InGameService, useValue: mockInGameService },
                { provide: AdminModeService, useValue: mockAdminModeService },
            ],
        });
        service = TestBed.inject(InGameKeyboardEventsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Event Listening', () => {
        it('should start listening to keyboard events', () => {
            spyOn(document, 'addEventListener');
            service.startListening();

            expect(document.addEventListener).toHaveBeenCalledWith('keyup', jasmine.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('keypress', jasmine.any(Function));
        });

        it('should not add listeners if already listening', () => {
            spyOn(document, 'addEventListener');
            service.startListening();
            service.startListening();

            expect(document.addEventListener).toHaveBeenCalledTimes(2);
        });

        it('should stop listening to keyboard events', () => {
            spyOn(document, 'removeEventListener');
            service.startListening();
            service.stopListening();

            expect(document.removeEventListener).toHaveBeenCalledWith('keyup', jasmine.any(Function));
            expect(document.removeEventListener).toHaveBeenCalledWith('keypress', jasmine.any(Function));
        });

        it('should not remove listeners if not listening', () => {
            spyOn(document, 'removeEventListener');
            service.stopListening();

            expect(document.removeEventListener).not.toHaveBeenCalled();
        });
    });

    describe('Movement Keys', () => {
        beforeEach(() => {
            mockInGameService.isMyTurn.and.returnValue(true);
            mockInGameService.isGameStarted.and.returnValue(true);
            service.startListening();
        });

        it('should handle up arrow key', () => {
            const event = new KeyboardEvent('keyup', { key: GameKey.Up });
            spyOn(event, 'preventDefault');
            document.dispatchEvent(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.N);
        });

        it('should handle down arrow key', () => {
            const event = new KeyboardEvent('keyup', { key: GameKey.Down });
            spyOn(event, 'preventDefault');
            document.dispatchEvent(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.S);
        });

        it('should handle left arrow key', () => {
            const event = new KeyboardEvent('keyup', { key: GameKey.Left });
            spyOn(event, 'preventDefault');
            document.dispatchEvent(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.W);
        });

        it('should handle right arrow key', () => {
            const event = new KeyboardEvent('keyup', { key: GameKey.Right });
            spyOn(event, 'preventDefault');
            document.dispatchEvent(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.E);
        });

        it('should ignore other keys', () => {
            const event = new KeyboardEvent('keyup', { key: 'a' });
            spyOn(event, 'preventDefault');
            document.dispatchEvent(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(mockInGameService.movePlayer).not.toHaveBeenCalled();
        });
    });

    describe('Admin Mode Key', () => {
        beforeEach(() => {
            service.startListening();
        });

        it('should handle admin mode toggle key', () => {
            const event = new KeyboardEvent('keypress', { key: GameKey.AdminMode });
            spyOn(event, 'preventDefault');
            document.dispatchEvent(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockAdminModeService.toggleAdminMode).toHaveBeenCalled();
        });

        it('should ignore other keypress events', () => {
            const event = new KeyboardEvent('keypress', { key: 'a' });
            spyOn(event, 'preventDefault');
            document.dispatchEvent(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(mockAdminModeService.toggleAdminMode).not.toHaveBeenCalled();
        });
    });

    describe('Game State Conditions', () => {
        beforeEach(() => {
            service.startListening();
        });

        it('should not handle movement when not my turn', () => {
            mockInGameService.isMyTurn.and.returnValue(false);
            mockInGameService.isGameStarted.and.returnValue(true);

            const event = new KeyboardEvent('keyup', { key: GameKey.Up });
            document.dispatchEvent(event);

            expect(mockInGameService.movePlayer).not.toHaveBeenCalled();
        });

        it('should not handle movement when game not started', () => {
            mockInGameService.isMyTurn.and.returnValue(true);
            mockInGameService.isGameStarted.and.returnValue(false);

            const event = new KeyboardEvent('keyup', { key: GameKey.Up });
            document.dispatchEvent(event);

            expect(mockInGameService.movePlayer).not.toHaveBeenCalled();
        });

        it('should not handle movement when neither my turn nor game started', () => {
            mockInGameService.isMyTurn.and.returnValue(false);
            mockInGameService.isGameStarted.and.returnValue(false);

            const event = new KeyboardEvent('keyup', { key: GameKey.Up });
            document.dispatchEvent(event);

            expect(mockInGameService.movePlayer).not.toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should stop listening on destroy', () => {
            spyOn(service, 'stopListening');
            service.ngOnDestroy();

            expect(service.stopListening).toHaveBeenCalled();
        });

        it('should remove event listeners on destroy', () => {
            spyOn(document, 'removeEventListener');
            service.startListening();
            service.ngOnDestroy();

            expect(document.removeEventListener).toHaveBeenCalledWith('keyup', jasmine.any(Function));
            expect(document.removeEventListener).toHaveBeenCalledWith('keypress', jasmine.any(Function));
        });
    });
});
