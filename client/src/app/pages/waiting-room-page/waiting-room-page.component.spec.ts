import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ROUTES } from '@app/enums/routes.enum';
import { AssetsService } from '@app/services/assets/assets.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';
import { WaitingRoomPageComponent } from './waiting-room-page.component';

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
const TEST_ATTACK = 4;
const TEST_BASE_DEFENSE = 4;
const TEST_DEFENSE_BONUS = 0;
const TEST_DEFENSE = 4;
const TEST_X_POSITION = 0;
const TEST_Y_POSITION = 0;
const TEST_START_POINT_ID = '';
const TEST_ACTIONS_REMAINING = 1;
const TEST_COMBAT_COUNT = 0;
const TEST_COMBAT_WINS = 0;
const TEST_COMBAT_LOSSES = 0;
const TEST_COMBAT_DRAWS = 0;
const TEST_IS_NOT_ADMIN = false;
const TEST_IS_IN_GAME = false;
const TEST_MAX_PLAYERS = 4;
const TEST_IS_CONNECTED = true;
const TEST_IS_NOT_CONNECTED = false;
const TEST_IS_LOCKED = true;
const TEST_IS_UNLOCKED = false;
const TEST_ERROR_TITLE = 'Session expirée';
const TEST_ERROR_MESSAGE = 'Veuillez rejoindre une session.';
const TEST_PLAYER_ID_CURRENT = 'test-player-id-1';
const TEST_AVATAR_STATIC_PATH = './assets/images/avatars/static/avatar1.png';

type MockPlayerService = {
    id: Signal<string>;
    isAdmin: Signal<boolean>;
    isConnected: jasmine.Spy;
    leaveSession: jasmine.Spy;
};

type MockSessionService = {
    players: Signal<Player[]>;
    isRoomLocked: Signal<boolean>;
    maxPlayers: Signal<number>;
    kickPlayer: jasmine.Spy;
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
    attack: TEST_ATTACK,
    baseDefense: TEST_BASE_DEFENSE,
    defenseBonus: TEST_DEFENSE_BONUS,
    defense: TEST_DEFENSE,
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
});

describe('WaitingRoomPageComponent', () => {
    let component: WaitingRoomPageComponent;
    let fixture: ComponentFixture<WaitingRoomPageComponent>;
    let mockPlayerService: MockPlayerService;
    let mockSessionService: MockSessionService;
    let mockNotificationCoordinatorService: jasmine.SpyObj<NotificationCoordinatorService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let playersSignal: ReturnType<typeof signal<Player[]>>;
    let isRoomLockedSignal: ReturnType<typeof signal<boolean>>;
    let maxPlayersSignal: ReturnType<typeof signal<number>>;
    let playerIdSignal: ReturnType<typeof signal<string>>;
    let isAdminSignal: ReturnType<typeof signal<boolean>>;

    beforeEach(async () => {
        const mockPlayer1 = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1);
        const mockPlayer2 = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2);
        const mockPlayers = [mockPlayer1, mockPlayer2];

        playersSignal = signal<Player[]>(mockPlayers);
        isRoomLockedSignal = signal<boolean>(TEST_IS_UNLOCKED);
        maxPlayersSignal = signal<number>(TEST_MAX_PLAYERS);
        playerIdSignal = signal<string>(TEST_PLAYER_ID_CURRENT);
        isAdminSignal = signal<boolean>(TEST_IS_NOT_ADMIN);

        mockPlayerService = {
            id: playerIdSignal.asReadonly(),
            isAdmin: isAdminSignal.asReadonly(),
            isConnected: jasmine.createSpy('isConnected').and.returnValue(TEST_IS_CONNECTED),
            leaveSession: jasmine.createSpy('leaveSession'),
        };

        mockSessionService = {
            players: playersSignal.asReadonly(),
            isRoomLocked: isRoomLockedSignal.asReadonly(),
            maxPlayers: maxPlayersSignal.asReadonly(),
            kickPlayer: jasmine.createSpy('kickPlayer'),
        };

        mockNotificationCoordinatorService = jasmine.createSpyObj('NotificationCoordinatorService', ['displayErrorPopup']);

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);
        mockAssetsService.getAvatarStaticImage.and.returnValue(TEST_AVATAR_STATIC_PATH);

        await TestBed.configureTestingModule({
            imports: [WaitingRoomPageComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: SessionService, useValue: mockSessionService },
                { provide: NotificationCoordinatorService, useValue: mockNotificationCoordinatorService },
                { provide: AssetsService, useValue: mockAssetsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should not display error when player is connected', () => {
            mockPlayerService.isConnected.and.returnValue(TEST_IS_CONNECTED);
            component.ngOnInit();

            expect(mockNotificationCoordinatorService.displayErrorPopup).not.toHaveBeenCalled();
        });

        it('should display error when player is not connected', () => {
            mockPlayerService.isConnected.and.returnValue(TEST_IS_NOT_CONNECTED);
            component.ngOnInit();

            expect(mockNotificationCoordinatorService.displayErrorPopup).toHaveBeenCalledOnceWith({
                title: TEST_ERROR_TITLE,
                message: TEST_ERROR_MESSAGE,
                redirectRoute: ROUTES.HomePage,
            });
        });
    });

    describe('players', () => {
        it('should return players signal from sessionService', () => {
            fixture.detectChanges();

            const result = component.players;

            expect(result).toBe(playersSignal.asReadonly());
            expect(result().length).toBe(2);
            expect(result()[0].id).toBe(TEST_PLAYER_ID_1);
            expect(result()[1].id).toBe(TEST_PLAYER_ID_2);
        });

        it('should reflect changes in sessionService players', () => {
            fixture.detectChanges();

            const initialPlayers = component.players();
            expect(initialPlayers.length).toBe(2);

            const newPlayer = createMockPlayer('new-player-id', 'New Player');
            playersSignal.set([newPlayer]);
            fixture.detectChanges();

            const updatedPlayers = component.players();
            expect(updatedPlayers.length).toBe(1);
            expect(updatedPlayers[0].id).toBe('new-player-id');
        });
    });

    describe('isRoomLocked', () => {
        it('should return isRoomLocked signal from sessionService', () => {
            isRoomLockedSignal.set(TEST_IS_LOCKED);
            fixture.detectChanges();

            const result = component.isRoomLocked;

            expect(result).toBe(isRoomLockedSignal.asReadonly());
            expect(result()).toBe(TEST_IS_LOCKED);
        });

        it('should return false when room is not locked', () => {
            isRoomLockedSignal.set(TEST_IS_UNLOCKED);
            fixture.detectChanges();

            expect(component.isRoomLocked()).toBe(TEST_IS_UNLOCKED);
        });
    });

    describe('maxPlayers', () => {
        it('should return maxPlayers signal from sessionService', () => {
            maxPlayersSignal.set(TEST_MAX_PLAYERS);
            fixture.detectChanges();

            const result = component.maxPlayers;

            expect(result).toBe(maxPlayersSignal.asReadonly());
            expect(result()).toBe(TEST_MAX_PLAYERS);
        });

        it('should reflect changes in sessionService maxPlayers', () => {
            const newMaxPlayers = 6;
            maxPlayersSignal.set(newMaxPlayers);
            fixture.detectChanges();

            expect(component.maxPlayers()).toBe(newMaxPlayers);
        });
    });

    describe('onBack', () => {
        it('should call playerService.leaveSession', () => {
            fixture.detectChanges();

            component.onBack();

            expect(mockPlayerService.leaveSession).toHaveBeenCalledTimes(1);
        });
    });
});

