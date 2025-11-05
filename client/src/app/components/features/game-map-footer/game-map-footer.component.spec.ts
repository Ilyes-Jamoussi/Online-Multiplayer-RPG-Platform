import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Orientation } from '@common/enums/orientation.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { GameMapFooterComponent } from './game-map-footer.component';

const MOCK_SPEED_VALUE = 3;
const EXPECTED_ACTIONS_COUNT = 2;

type MockPlayerService = Partial<PlayerService> & {
    _speedSignal: WritableSignal<number>;
    _isAdminSignal: WritableSignal<boolean>;
};

type MockInGameService = Partial<InGameService> & {
    _availableActionsSignal: WritableSignal<AvailableAction[]>;
    _isMyTurnSignal: WritableSignal<boolean>;
    _isGameStartedSignal: WritableSignal<boolean>;
    _hasUsedActionSignal: WritableSignal<boolean>;
};

describe('GameMapFooterComponent', () => {
    let component: GameMapFooterComponent;
    let fixture: ComponentFixture<GameMapFooterComponent>;
    let mockPlayerService: MockPlayerService;
    let mockInGameService: MockInGameService;
    let mockAdminModeService: jasmine.SpyObj<AdminModeService>;

    beforeEach(async () => {
        const speedSignal = signal(MOCK_SPEED_VALUE);
        const isAdminSignal = signal(false);
        const availableActionsSignal = signal([
            { type: 'ATTACK', x: 1, y: 1 },
            { type: 'DOOR', x: 2, y: 2 },
        ] as AvailableAction[]);
        const isMyTurnSignal = signal(true);
        const isGameStartedSignal = signal(true);
        const hasUsedActionSignal = signal(false);

        mockPlayerService = {
            speed: speedSignal.asReadonly(),
            isAdmin: isAdminSignal.asReadonly(),
            _speedSignal: speedSignal,
            _isAdminSignal: isAdminSignal,
        };

        mockInGameService = {
            availableActions: availableActionsSignal.asReadonly(),
            isMyTurn: isMyTurnSignal.asReadonly(),
            isGameStarted: isGameStartedSignal.asReadonly(),
            hasUsedAction: hasUsedActionSignal.asReadonly(),
            activateActionMode: jasmine.createSpy('activateActionMode'),
            movePlayer: jasmine.createSpy('movePlayer'),
            _availableActionsSignal: availableActionsSignal,
            _isMyTurnSignal: isMyTurnSignal,
            _isGameStartedSignal: isGameStartedSignal,
            _hasUsedActionSignal: hasUsedActionSignal,
        };

        mockAdminModeService = jasmine.createSpyObj('AdminModeService', ['toggleAdminMode']);

        await TestBed.configureTestingModule({
            imports: [GameMapFooterComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: InGameService, useValue: mockInGameService },
                { provide: AdminModeService, useValue: mockAdminModeService },
            ],
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
        it('should add and remove event listeners', () => {
            spyOn(document, 'addEventListener');
            spyOn(document, 'removeEventListener');

            component.ngOnInit();
            expect(document.addEventListener).toHaveBeenCalledWith('keydown', jasmine.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('keyup', jasmine.any(Function));

            component.ngOnDestroy();
            expect(document.removeEventListener).toHaveBeenCalledWith('keydown', jasmine.any(Function));
            expect(document.removeEventListener).toHaveBeenCalledWith('keyup', jasmine.any(Function));
        });
    });

    describe('keyboard handling', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should handle key events correctly', () => {
            const keyDownEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            const keyUpEvent = new KeyboardEvent('keyup', { key: 'ArrowUp' });

            component['handleKeyDown'](keyDownEvent);
            expect(component.isKeyPressed('ArrowUp')).toBe(true);

            component['handleKeyUp'](keyUpEvent);
            expect(component.isKeyPressed('ArrowUp')).toBe(false);
        });

        it('should handle admin mode key', () => {
            const event = new KeyboardEvent('keydown', { key: 'd' });
            component['handleKeyDown'](event);
            expect(component.isKeyPressed('d')).toBe(true);
        });

        it('should ignore non-relevant keys', () => {
            const event = new KeyboardEvent('keydown', { key: 'a' });
            component['handleKeyDown'](event);
            expect(component.isKeyPressed('a')).toBe(false);
        });
    });

    describe('getters', () => {
        it('should return correct values from services', () => {
            expect(component.remainingMovements).toBe(MOCK_SPEED_VALUE);
            expect(component.availableActionsCount).toBe(EXPECTED_ACTIONS_COUNT);
            expect(component.isMyTurn).toBe(true);
            expect(component.isGameStarted).toBe(true);
            expect(component.hasUsedAction).toBe(false);
            expect(component.isAdmin).toBe(false);
        });
    });

    describe('isActionDisabled', () => {
        it('should return false when all conditions are met', () => {
            expect(component.isActionDisabled()).toBe(false);
        });

        it('should return true for various disabled conditions', () => {
            mockInGameService._isMyTurnSignal.set(false);
            expect(component.isActionDisabled()).toBe(true);

            mockInGameService._isMyTurnSignal.set(true);
            mockInGameService._isGameStartedSignal.set(false);
            expect(component.isActionDisabled()).toBe(true);

            mockInGameService._isGameStartedSignal.set(true);
            mockInGameService._hasUsedActionSignal.set(true);
            expect(component.isActionDisabled()).toBe(true);

            mockInGameService._hasUsedActionSignal.set(false);
            mockInGameService._availableActionsSignal.set([]);
            expect(component.isActionDisabled()).toBe(true);
        });
    });

    describe('hasAvailableActions', () => {
        it('should return correct availability status', () => {
            expect(component.hasAvailableActions()).toBe(true);

            mockInGameService._availableActionsSignal.set([]);
            expect(component.hasAvailableActions()).toBe(false);
        });
    });

    describe('actions', () => {
        it('should call activateActionMode on onAction', () => {
            component.onAction();
            expect(mockInGameService.activateActionMode).toHaveBeenCalled();
        });

        it('should move player in all directions when conditions are met', () => {
            component.onMoveUp();
            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.N);

            component.onMoveDown();
            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.S);

            component.onMoveLeft();
            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.W);

            component.onMoveRight();
            expect(mockInGameService.movePlayer).toHaveBeenCalledWith(Orientation.E);
        });

        it('should not move player when conditions are not met', () => {
            mockInGameService._isMyTurnSignal.set(false);
            component.onMoveUp();
            expect(mockInGameService.movePlayer).not.toHaveBeenCalled();

            mockInGameService._isMyTurnSignal.set(true);
            mockInGameService._isGameStartedSignal.set(false);
            component.onMoveUp();
            expect(mockInGameService.movePlayer).not.toHaveBeenCalled();
        });

        it('should handle admin mode toggle correctly', () => {
            mockPlayerService._isAdminSignal.set(true);
            component.onToggleDebug();
            expect(mockAdminModeService.toggleAdminMode).toHaveBeenCalled();

            mockAdminModeService.toggleAdminMode.calls.reset();
            mockPlayerService._isAdminSignal.set(false);
            component.onToggleDebug();
            expect(mockAdminModeService.toggleAdminMode).not.toHaveBeenCalled();
        });
    });

    describe('template rendering', () => {
        it('should display correct values in template', () => {
            fixture.detectChanges();

            const movementsElement = fixture.nativeElement.querySelector('.footer-value');
            expect(movementsElement.textContent.trim()).toBe(MOCK_SPEED_VALUE.toString());

            const actionsElement = fixture.nativeElement.querySelector('.actions-count');
            expect(actionsElement.textContent.trim()).toBe(EXPECTED_ACTIONS_COUNT.toString());
        });
    });
});
