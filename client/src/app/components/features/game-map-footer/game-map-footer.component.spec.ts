import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Orientation } from '@common/enums/orientation.enum';
import { GameMapFooterComponent } from './game-map-footer.component';

describe('GameMapFooterComponent', () => {
    let component: GameMapFooterComponent;
    let fixture: ComponentFixture<GameMapFooterComponent>;
    let mockPlayerService: any;
    let mockInGameService: any;
    let mockAdminModeService: jasmine.SpyObj<AdminModeService>;

    beforeEach(async () => {
        mockPlayerService = {
            speed: signal(3),
            isAdmin: signal(false)
        };

        mockInGameService = {
            availableActions: signal([{ type: 'move' }, { type: 'attack' }]),
            isMyTurn: signal(true),
            isGameStarted: signal(true),
            hasUsedAction: signal(false),
            activateActionMode: jasmine.createSpy('activateActionMode'),
            movePlayer: jasmine.createSpy('movePlayer')
        };

        mockAdminModeService = jasmine.createSpyObj('AdminModeService', ['toggleAdminMode']);

        await TestBed.configureTestingModule({
            imports: [GameMapFooterComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: InGameService, useValue: mockInGameService },
                { provide: AdminModeService, useValue: mockAdminModeService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapFooterComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('lifecycle', () => {
        it('should add event listeners on init', () => {
            spyOn(document, 'addEventListener');

            component.ngOnInit();

            expect(document.addEventListener).toHaveBeenCalledWith('keydown', jasmine.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('keyup', jasmine.any(Function));
        });

        it('should remove event listeners on destroy', () => {
            spyOn(document, 'removeEventListener');
            component.ngOnInit();

            component.ngOnDestroy();

            expect(document.removeEventListener).toHaveBeenCalledWith('keydown', jasmine.any(Function));
            expect(document.removeEventListener).toHaveBeenCalledWith('keyup', jasmine.any(Function));
        });
    });

    describe('keyboard handling', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should add key to pressedKeys on keydown for arrow keys', () => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });

            component['handleKeyDown'](event);

            expect(component.isKeyPressed('ArrowUp')).toBe(true);
        });

        it('should add key to pressedKeys on keydown for admin mode key', () => {
            const event = new KeyboardEvent('keydown', { key: 'd' });

            component['handleKeyDown'](event);

            expect(component.isKeyPressed('d')).toBe(true);
        });

        it('should not add key to pressedKeys for other keys', () => {
            const event = new KeyboardEvent('keydown', { key: 'a' });

            component['handleKeyDown'](event);

            expect(component.isKeyPressed('a')).toBe(false);
        });

        it('should remove key from pressedKeys on keyup', () => {
            component.pressedKeys.add('ArrowUp');
            const event = new KeyboardEvent('keyup', { key: 'ArrowUp' });

            component['handleKeyUp'](event);

            expect(component.isKeyPressed('ArrowUp')).toBe(false);
        });
    });

    describe('getters', () => {
        it('should return remaining movements from playerService', () => {
            expect(component.remainingMovements).toBe(3);
        });

        it('should return available actions count from inGameService', () => {
            expect(component.availableActionsCount).toBe(2);
        });

        it('should return isMyTurn from inGameService', () => {
            expect(component.isMyTurn).toBe(true);
        });

        it('should return isGameStarted from inGameService', () => {
            expect(component.isGameStarted).toBe(true);
        });

        it('should return hasUsedAction from inGameService', () => {
            expect(component.hasUsedAction).toBe(false);
        });

        it('should return isAdmin from playerService', () => {
            expect(component.isAdmin).toBe(false);
        });
    });

    describe('isActionDisabled', () => {
        it('should return false when all conditions are met', () => {
            expect(component.isActionDisabled()).toBe(false);
        });

        it('should return true when not my turn', () => {
            mockInGameService.isMyTurn = signal(false);

            expect(component.isActionDisabled()).toBe(true);
        });

        it('should return true when game not started', () => {
            mockInGameService.isGameStarted = signal(false);

            expect(component.isActionDisabled()).toBe(true);
        });

        it('should return true when action already used', () => {
            mockInGameService.hasUsedAction = signal(true);

            expect(component.isActionDisabled()).toBe(true);
        });

        it('should return true when no available actions', () => {
            mockInGameService.availableActions = signal([]);

            expect(component.isActionDisabled()).toBe(true);
        });
    });

    describe('hasAvailableActions', () => {
        it('should return true when actions are available', () => {
            expect(component.hasAvailableActions()).toBe(true);
        });

        it('should return false when no actions available', () => {
            mockInGameService.availableActions = signal([]);

            expect(component.hasAvailableActions()).toBe(false);
        });
    });

    describe('actions', () => {
        it('should call activateActionMode on onAction', () => {
            component.onAction();

            expect(mockInGameService.activateActionMode).toHaveBeenCalled();
        });

        it('should move player up when conditions are met', () => {
            component.onMoveUp();

            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.N);
        });

        it('should not move player up when not my turn', () => {
            mockInGameService.isMyTurn = signal(false);

            component.onMoveUp();

            expect(mockInGameService.movePlayer).not.toHaveBeenCalled();
        });

        it('should not move player up when game not started', () => {
            mockInGameService.isGameStarted = signal(false);

            component.onMoveUp();

            expect(mockInGameService.movePlayer).not.toHaveBeenCalled();
        });

        it('should move player down when conditions are met', () => {
            component.onMoveDown();

            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.S);
        });

        it('should move player left when conditions are met', () => {
            component.onMoveLeft();

            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.W);
        });

        it('should move player right when conditions are met', () => {
            component.onMoveRight();

            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.E);
        });

        it('should toggle admin mode when admin', () => {
            mockPlayerService.isAdmin = signal(true);

            component.onToggleDebug();

            expect(mockAdminModeService.toggleAdminMode).toHaveBeenCalled();
        });

        it('should not toggle admin mode when not admin', () => {
            mockPlayerService.isAdmin = signal(false);

            component.onToggleDebug();

            expect(mockAdminModeService.toggleAdminMode).not.toHaveBeenCalled();
        });
    });

    describe('template rendering', () => {
        it('should display remaining movements', () => {
            fixture.detectChanges();

            const movementsElement = fixture.nativeElement.querySelector('.footer-value');
            expect(movementsElement.textContent.trim()).toBe('3');
        });

        it('should display available actions count', () => {
            fixture.detectChanges();

            const actionsElement = fixture.nativeElement.querySelector('.actions-count');
            expect(actionsElement.textContent.trim()).toBe('2');
        });

        it('should show debug control when admin', () => {
            mockPlayerService.isAdmin = signal(true);
            fixture.detectChanges();

            const debugControl = fixture.nativeElement.querySelector('.debug-control');
            expect(debugControl).toBeTruthy();
        });

        it('should not show debug control when not admin', () => {
            mockPlayerService.isAdmin = signal(false);
            fixture.detectChanges();

            const debugControl = fixture.nativeElement.querySelector('.debug-control');
            expect(debugControl).toBeFalsy();
        });

        it('should disable action button when conditions not met', () => {
            mockInGameService.isMyTurn = signal(false);
            fixture.detectChanges();

            const actionButton = fixture.nativeElement.querySelector('.action-btn');
            expect(actionButton.disabled).toBe(true);
        });

        it('should enable action button when conditions are met', () => {
            fixture.detectChanges();

            const actionButton = fixture.nativeElement.querySelector('.action-btn');
            expect(actionButton.disabled).toBe(false);
        });
    });
});