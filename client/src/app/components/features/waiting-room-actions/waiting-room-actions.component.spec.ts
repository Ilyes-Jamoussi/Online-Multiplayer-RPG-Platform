import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { WaitingRoomActionsComponent } from './waiting-room-actions.component';

// Test constants
const TEST_PLAYER_ID_1 = 'test-player-id-1';
const TEST_PLAYER_ID_2 = 'test-player-id-2';
const TEST_PLAYER_NAME_1 = 'Test Player 1';
const TEST_PLAYER_NAME_2 = 'Test Player 2';
const TEST_BASE_HEALTH = 4;
const TEST_HEALTH_BONUS = 0;
const TEST_HEALTH = 4;
const TEST_MAX_HEALTH = 4;
const TEST_BASE_SPEED = 3;
const TEST_SPEED_BONUS = 0;
const TEST_SPEED = 3;
const TEST_BASE_ATTACK = 4;
const TEST_ATTACK_BONUS = 0;
const TEST_BASE_DEFENSE = 4;
const TEST_DEFENSE_BONUS = 0;
const TEST_BOAT_SPEED_BONUS = 0;
const TEST_BOAT_SPEED = 0;
const TEST_HAS_COMBAT_BONUS = false;
const TEST_X_POSITION = 0;
const TEST_Y_POSITION = 0;
const TEST_START_POINT_ID = '';
const TEST_ACTIONS_REMAINING = 1;
const TEST_COMBAT_COUNT = 0;
const TEST_COMBAT_WINS = 0;
const TEST_COMBAT_LOSSES = 0;
const TEST_COMBAT_DRAWS = 0;
const TEST_IS_ADMIN = true;
const TEST_IS_NOT_ADMIN = false;
const TEST_IS_IN_GAME = false;
const TEST_IS_LOCKED = true;
const TEST_IS_UNLOCKED = false;
const TEST_MAX_PLAYERS = 4;

type MockPlayerService = {
    isAdmin: Signal<boolean>;
};

type MockSessionService = {
    players: Signal<Player[]>;
    maxPlayers: Signal<number>;
    isRoomLocked: Signal<boolean>;
    canBeLocked: jasmine.Spy;
    canBeUnlocked: jasmine.Spy;
    canStartGame: jasmine.Spy;
    lock: jasmine.Spy;
    unlock: jasmine.Spy;
    startGameSession: jasmine.Spy;
    addVirtualPlayer: jasmine.Spy;
};

const createMockPlayer = (id: string, name: string, isAdmin: boolean = TEST_IS_NOT_ADMIN): Player => ({
    id,
    name,
    avatar: Avatar.Avatar1,
    isAdmin,
    baseHealth: TEST_BASE_HEALTH,
    healthBonus: TEST_HEALTH_BONUS,
    health: TEST_HEALTH,
    maxHealth: TEST_MAX_HEALTH,
    baseSpeed: TEST_BASE_SPEED,
    speedBonus: TEST_SPEED_BONUS,
    speed: TEST_SPEED,
    baseAttack: TEST_BASE_ATTACK,
    attackBonus: TEST_ATTACK_BONUS,
    baseDefense: TEST_BASE_DEFENSE,
    defenseBonus: TEST_DEFENSE_BONUS,
    boatSpeedBonus: TEST_BOAT_SPEED_BONUS,
    boatSpeed: TEST_BOAT_SPEED,
    attackDice: Dice.D6,
    defenseDice: Dice.D6,
    x: TEST_X_POSITION,
    y: TEST_Y_POSITION,
    isInGame: TEST_IS_IN_GAME,
    startPointId: TEST_START_POINT_ID,
    actionsRemaining: TEST_ACTIONS_REMAINING,
    combatCount: TEST_COMBAT_COUNT,
    combatWins: TEST_COMBAT_WINS,
    combatLosses: TEST_COMBAT_LOSSES,
    combatDraws: TEST_COMBAT_DRAWS,
    hasCombatBonus: TEST_HAS_COMBAT_BONUS,
});

describe('WaitingRoomActionsComponent', () => {
    let component: WaitingRoomActionsComponent;
    let fixture: ComponentFixture<WaitingRoomActionsComponent>;
    let mockPlayerService: MockPlayerService;
    let mockSessionService: MockSessionService;
    let playersSignal: ReturnType<typeof signal<Player[]>>;
    let isAdminSignal: ReturnType<typeof signal<boolean>>;
    let isRoomLockedSignal: ReturnType<typeof signal<boolean>>;
    let maxPlayersSignal: ReturnType<typeof signal<number>>;

    beforeEach(async () => {
        const mockPlayer1 = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1);
        const mockPlayer2 = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2);
        const mockPlayers = [mockPlayer1, mockPlayer2];

        playersSignal = signal<Player[]>(mockPlayers);
        isAdminSignal = signal<boolean>(TEST_IS_NOT_ADMIN);
        isRoomLockedSignal = signal<boolean>(TEST_IS_UNLOCKED);
        maxPlayersSignal = signal<number>(TEST_MAX_PLAYERS);

        mockPlayerService = {
            isAdmin: isAdminSignal.asReadonly(),
        };

        mockSessionService = {
            players: playersSignal.asReadonly(),
            maxPlayers: maxPlayersSignal.asReadonly(),
            isRoomLocked: isRoomLockedSignal.asReadonly(),
            canBeLocked: jasmine.createSpy('canBeLocked').and.returnValue(true),
            canBeUnlocked: jasmine.createSpy('canBeUnlocked').and.returnValue(false),
            canStartGame: jasmine.createSpy('canStartGame').and.returnValue(false),
            lock: jasmine.createSpy('lock'),
            unlock: jasmine.createSpy('unlock'),
            startGameSession: jasmine.createSpy('startGameSession'),
            addVirtualPlayer: jasmine.createSpy('addVirtualPlayer'),
        };

        await TestBed.configureTestingModule({
            imports: [WaitingRoomActionsComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: SessionService, useValue: mockSessionService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomActionsComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('canAddVirtualPlayer', () => {
        it('should return true when players count is less than maxPlayers', () => {
            const mockPlayer1 = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1);
            const mockPlayer2 = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2);
            playersSignal.set([mockPlayer1, mockPlayer2]);
            maxPlayersSignal.set(TEST_MAX_PLAYERS);
            fixture.detectChanges();

            expect(component.canAddVirtualPlayer()).toBe(true);
        });

        it('should return false when players count equals maxPlayers', () => {
            const mockPlayer1 = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1);
            const mockPlayer2 = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2);
            const mockPlayer3 = createMockPlayer('player-3', 'Player 3');
            const mockPlayer4 = createMockPlayer('player-4', 'Player 4');
            playersSignal.set([mockPlayer1, mockPlayer2, mockPlayer3, mockPlayer4]);
            maxPlayersSignal.set(TEST_MAX_PLAYERS);
            fixture.detectChanges();

            expect(component.canAddVirtualPlayer()).toBe(false);
        });
    });

    describe('isAdmin', () => {
        it('should return true when player is admin', () => {
            isAdminSignal.set(TEST_IS_ADMIN);
            fixture.detectChanges();

            expect(component.isAdmin()).toBe(true);
        });

        it('should return false when player is not admin', () => {
            isAdminSignal.set(TEST_IS_NOT_ADMIN);
            fixture.detectChanges();

            expect(component.isAdmin()).toBe(false);
        });
    });

    describe('isLocked', () => {
        it('should return true when room is locked', () => {
            isRoomLockedSignal.set(TEST_IS_LOCKED);
            fixture.detectChanges();

            expect(component.isLocked()).toBe(true);
        });

        it('should return false when room is not locked', () => {
            isRoomLockedSignal.set(TEST_IS_UNLOCKED);
            fixture.detectChanges();

            expect(component.isLocked()).toBe(false);
        });
    });

    describe('canToggleLock', () => {
        it('should return true when canBeLocked returns true', () => {
            mockSessionService.canBeLocked.and.returnValue(true);
            mockSessionService.canBeUnlocked.and.returnValue(false);
            fixture.detectChanges();

            expect(component.canToggleLock()).toBe(true);
        });

        it('should return true when canBeUnlocked returns true', () => {
            mockSessionService.canBeLocked.and.returnValue(false);
            mockSessionService.canBeUnlocked.and.returnValue(true);
            fixture.detectChanges();

            expect(component.canToggleLock()).toBe(true);
        });

        it('should return false when both canBeLocked and canBeUnlocked return false', () => {
            mockSessionService.canBeLocked.and.returnValue(false);
            mockSessionService.canBeUnlocked.and.returnValue(false);
            fixture.detectChanges();

            expect(component.canToggleLock()).toBe(false);
        });
    });

    describe('canStartGame', () => {
        it('should return true when sessionService.canStartGame returns true', () => {
            mockSessionService.canStartGame.and.returnValue(true);
            fixture.detectChanges();

            expect(component.canStartGame()).toBe(true);
        });

        it('should return false when sessionService.canStartGame returns false', () => {
            mockSessionService.canStartGame.and.returnValue(false);
            fixture.detectChanges();

            expect(component.canStartGame()).toBe(false);
        });
    });

    describe('toggleLock', () => {
        it('should call sessionService.lock when canBeLocked returns true', () => {
            mockSessionService.canBeLocked.and.returnValue(true);
            mockSessionService.canBeUnlocked.and.returnValue(false);
            fixture.detectChanges();

            component.toggleLock();

            expect(mockSessionService.lock).toHaveBeenCalledTimes(1);
            expect(mockSessionService.unlock).not.toHaveBeenCalled();
        });

        it('should call sessionService.unlock when canBeUnlocked returns true', () => {
            mockSessionService.canBeLocked.and.returnValue(false);
            mockSessionService.canBeUnlocked.and.returnValue(true);
            fixture.detectChanges();

            component.toggleLock();

            expect(mockSessionService.unlock).toHaveBeenCalledTimes(1);
            expect(mockSessionService.lock).not.toHaveBeenCalled();
        });

        it('should not call any method when both canBeLocked and canBeUnlocked return false', () => {
            mockSessionService.canBeLocked.and.returnValue(false);
            mockSessionService.canBeUnlocked.and.returnValue(false);
            fixture.detectChanges();

            component.toggleLock();

            expect(mockSessionService.lock).not.toHaveBeenCalled();
            expect(mockSessionService.unlock).not.toHaveBeenCalled();
        });
    });

    describe('startGame', () => {
        it('should call sessionService.startGameSession', () => {
            fixture.detectChanges();

            component.startGame();

            expect(mockSessionService.startGameSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('showVirtualPlayerModal', () => {
        it('should return false initially', () => {
            fixture.detectChanges();

            expect(component.showVirtualPlayerModal()).toBe(false);
        });
    });

    describe('openVirtualPlayerModal', () => {
        it('should set showVirtualPlayerModal to true', () => {
            fixture.detectChanges();

            expect(component.showVirtualPlayerModal()).toBe(false);

            component.openVirtualPlayerModal();

            expect(component.showVirtualPlayerModal()).toBe(true);
        });
    });

    describe('closeVirtualPlayerModal', () => {
        it('should set showVirtualPlayerModal to false', () => {
            fixture.detectChanges();
            component.openVirtualPlayerModal();
            expect(component.showVirtualPlayerModal()).toBe(true);

            component.closeVirtualPlayerModal();

            expect(component.showVirtualPlayerModal()).toBe(false);
        });
    });

    describe('onVirtualPlayerTypeSelected', () => {
        it('should call sessionService.addVirtualPlayer and close modal', () => {
            fixture.detectChanges();
            component.openVirtualPlayerModal();
            expect(component.showVirtualPlayerModal()).toBe(true);

            component.onVirtualPlayerTypeSelected(VirtualPlayerType.Offensive);

            expect(mockSessionService.addVirtualPlayer).toHaveBeenCalledTimes(1);
            expect(mockSessionService.addVirtualPlayer).toHaveBeenCalledWith(VirtualPlayerType.Offensive);
            expect(component.showVirtualPlayerModal()).toBe(false);
        });

        it('should call sessionService.addVirtualPlayer with Defensive type', () => {
            fixture.detectChanges();

            component.onVirtualPlayerTypeSelected(VirtualPlayerType.Defensive);

            expect(mockSessionService.addVirtualPlayer).toHaveBeenCalledTimes(1);
            expect(mockSessionService.addVirtualPlayer).toHaveBeenCalledWith(VirtualPlayerType.Defensive);
            expect(component.showVirtualPlayerModal()).toBe(false);
        });
    });
});

