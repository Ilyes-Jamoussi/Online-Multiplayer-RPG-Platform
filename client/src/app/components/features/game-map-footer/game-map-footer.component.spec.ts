import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { Dice } from '@common/enums/dice.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { Player } from '@common/interfaces/player.interface';
import { GameMapFooterComponent } from './game-map-footer.component';

const MOCK_SPEED_VALUE = 3;
const EXPECTED_ACTIONS_COUNT = 2;

type MockPlayerService = Partial<PlayerService> & {
    _speedSignal: WritableSignal<number>;
    _isAdminSignal: WritableSignal<boolean>;
    _playerSignal: WritableSignal<Player>;
};

type MockInGameService = Partial<InGameService> & {
    _availableActionsSignal: WritableSignal<AvailableAction[]>;
    _isMyTurnSignal: WritableSignal<boolean>;
    _isGameStartedSignal: WritableSignal<boolean>;
    _hasUsedActionSignal: WritableSignal<boolean>;
    _isActionModeActiveSignal: WritableSignal<boolean>;
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
        const playerSignal = signal<Player>({
            id: 'test-player',
            name: 'Test Player',
            avatar: null,
            isAdmin: false,
            baseHealth: 10,
            healthBonus: 0,
            health: 10,
            maxHealth: 10,
            baseSpeed: 3,
            speedBonus: 0,
            speed: MOCK_SPEED_VALUE,
            boatSpeedBonus: 0,
            boatSpeed: 0,
            baseAttack: 4,
            attackBonus: 0,
            baseDefense: 4,
            defenseBonus: 0,
            attackDice: Dice.D6,
            defenseDice: Dice.D6,
            x: 0,
            y: 0,
            isInGame: true,
            startPointId: '',
            actionsRemaining: 1,
            combatCount: 0,
            combatWins: 0,
            combatLosses: 0,
            combatDraws: 0,
            hasCombatBonus: false,
        });
        const availableActionsSignal = signal([
            { type: AvailableActionType.ATTACK, x: 1, y: 1 },
            { type: AvailableActionType.DOOR, x: 2, y: 2 },
        ] as AvailableAction[]);
        const isMyTurnSignal = signal(true);
        const isGameStartedSignal = signal(true);
        const hasUsedActionSignal = signal(false);
        const isActionModeActiveSignal = signal(false);

        mockPlayerService = {
            speed: speedSignal.asReadonly(),
            isAdmin: isAdminSignal.asReadonly(),
            player: playerSignal.asReadonly(),
            _speedSignal: speedSignal,
            _isAdminSignal: isAdminSignal,
            _playerSignal: playerSignal,
        };

        mockInGameService = {
            availableActions: availableActionsSignal.asReadonly(),
            isMyTurn: isMyTurnSignal.asReadonly(),
            isGameStarted: isGameStartedSignal.asReadonly(),
            hasUsedAction: hasUsedActionSignal.asReadonly(),
            isActionModeActive: isActionModeActiveSignal.asReadonly(),
            activateActionMode: jasmine.createSpy('activateActionMode'),
            deactivateActionMode: jasmine.createSpy('deactivateActionMode'),
            movePlayer: jasmine.createSpy('movePlayer'),
            _availableActionsSignal: availableActionsSignal,
            _isMyTurnSignal: isMyTurnSignal,
            _isGameStartedSignal: isGameStartedSignal,
            _hasUsedActionSignal: hasUsedActionSignal,
            _isActionModeActiveSignal: isActionModeActiveSignal,
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
        it('should call activateActionMode on onAction when mode is inactive', () => {
            mockInGameService._isActionModeActiveSignal.set(false);
            component.onAction();
            expect(mockInGameService.activateActionMode).toHaveBeenCalled();
            expect(mockInGameService.deactivateActionMode).not.toHaveBeenCalled();
        });

        it('should call deactivateActionMode on onAction when mode is active', () => {
            mockInGameService._isActionModeActiveSignal.set(true);
            component.onAction();
            expect(mockInGameService.deactivateActionMode).toHaveBeenCalled();
            expect(mockInGameService.activateActionMode).not.toHaveBeenCalled();
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
