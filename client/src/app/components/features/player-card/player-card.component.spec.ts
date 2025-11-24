import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';
import { PlayerCardComponent } from './player-card.component';

// Test constants
const TEST_PLAYER_ID_1 = 'test-player-id-1';
const TEST_PLAYER_ID_2 = 'test-player-id-2';
const TEST_PLAYER_NAME_1 = 'Test Player 1';
const TEST_PLAYER_NAME_2 = 'Test Player 2';
const TEST_AVATAR_STATIC_PATH_1 = './assets/images/avatars/static/avatar1.png';
const TEST_AVATAR_STATIC_PATH_2 = './assets/images/avatars/static/avatar2.png';
const TEST_AVATAR_STATIC_PATH_NULL = '';
const TEST_AVATAR = Avatar.Avatar1;
const TEST_AVATAR_2 = Avatar.Avatar2;
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
const CARD_CLASS_IS_ME = 'is-me';
const CARD_CLASS_ADMIN = 'is-admin';

type MockPlayerService = {
    id: Signal<string>;
    isAdmin: Signal<boolean>;
};

const createMockPlayer = (id: string, name: string, isAdmin: boolean = TEST_IS_NOT_ADMIN, avatar: Avatar | null = TEST_AVATAR): Player => ({
    id,
    name,
    avatar,
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

describe('PlayerCardComponent', () => {
    let component: PlayerCardComponent;
    let fixture: ComponentFixture<PlayerCardComponent>;
    let mockPlayerService: MockPlayerService;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockSessionService: jasmine.SpyObj<SessionService>;
    let playerIdSignal: ReturnType<typeof signal<string>>;
    let isAdminSignal: ReturnType<typeof signal<boolean>>;

    beforeEach(async () => {
        playerIdSignal = signal<string>(TEST_PLAYER_ID_1);
        isAdminSignal = signal<boolean>(TEST_IS_ADMIN);

        mockPlayerService = {
            id: playerIdSignal.asReadonly(),
            isAdmin: isAdminSignal.asReadonly(),
        };

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);
        mockAssetsService.getAvatarStaticImage.and.callFake((avatar: Avatar | null) => {
            if (avatar === TEST_AVATAR) return TEST_AVATAR_STATIC_PATH_1;
            if (avatar === TEST_AVATAR_2) return TEST_AVATAR_STATIC_PATH_2;
            return TEST_AVATAR_STATIC_PATH_NULL;
        });

        mockSessionService = jasmine.createSpyObj('SessionService', ['kickPlayer']);

        await TestBed.configureTestingModule({
            imports: [PlayerCardComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: SessionService, useValue: mockSessionService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerCardComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('isMe', () => {
        it('should return true when player id matches current player id', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1);
            component.player = player;
            fixture.detectChanges();

            expect(component.isMe).toBe(true);
        });

        it('should return false when player id does not match current player id', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2);
            component.player = player;
            fixture.detectChanges();

            expect(component.isMe).toBe(false);
        });
    });

    describe('isAdmin', () => {
        it('should return true when player is admin', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, TEST_IS_ADMIN);
            component.player = player;
            fixture.detectChanges();

            expect(component.isAdmin).toBe(true);
        });

        it('should return false when player is not admin', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, TEST_IS_NOT_ADMIN);
            component.player = player;
            fixture.detectChanges();

            expect(component.isAdmin).toBe(false);
        });
    });

    describe('cardClasses', () => {
        it('should return is-me class when player is current player', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1);
            component.player = player;
            fixture.detectChanges();

            const classes = component.cardClasses;
            expect(classes[CARD_CLASS_IS_ME]).toBe(true);
            expect(classes[CARD_CLASS_ADMIN]).toBe(false);
        });

        it('should return admin class when player is admin', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2, TEST_IS_ADMIN);
            component.player = player;
            fixture.detectChanges();

            const classes = component.cardClasses;
            expect(classes[CARD_CLASS_IS_ME]).toBe(false);
            expect(classes[CARD_CLASS_ADMIN]).toBe(true);
        });

        it('should return both classes when player is current player and admin', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, TEST_IS_ADMIN);
            component.player = player;
            fixture.detectChanges();

            const classes = component.cardClasses;
            expect(classes[CARD_CLASS_IS_ME]).toBe(true);
            expect(classes[CARD_CLASS_ADMIN]).toBe(true);
        });

        it('should return no classes when player is neither current player nor admin', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2, TEST_IS_NOT_ADMIN);
            component.player = player;
            fixture.detectChanges();

            const classes = component.cardClasses;
            expect(classes[CARD_CLASS_IS_ME]).toBe(false);
            expect(classes[CARD_CLASS_ADMIN]).toBe(false);
        });
    });

    describe('showKickButton', () => {
        it('should return true when current player is admin and target player is not admin', () => {
            isAdminSignal.set(TEST_IS_ADMIN);
            const player = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2, TEST_IS_NOT_ADMIN);
            component.player = player;
            fixture.detectChanges();

            expect(component.showKickButton).toBe(true);
        });

        it('should return false when current player is not admin', () => {
            isAdminSignal.set(TEST_IS_NOT_ADMIN);
            const player = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2, TEST_IS_NOT_ADMIN);
            component.player = player;
            fixture.detectChanges();

            expect(component.showKickButton).toBe(false);
        });

        it('should return false when target player is admin', () => {
            isAdminSignal.set(TEST_IS_ADMIN);
            const player = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2, TEST_IS_ADMIN);
            component.player = player;
            fixture.detectChanges();

            expect(component.showKickButton).toBe(false);
        });

        it('should return false when current player is admin and target player is also admin', () => {
            isAdminSignal.set(TEST_IS_ADMIN);
            const player = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2, TEST_IS_ADMIN);
            component.player = player;
            fixture.detectChanges();

            expect(component.showKickButton).toBe(false);
        });
    });

    describe('kickPlayer', () => {
        it('should call sessionService.kickPlayer with player id', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2);
            component.player = player;
            fixture.detectChanges();

            component.kickPlayer();

            expect(mockSessionService.kickPlayer).toHaveBeenCalledOnceWith(TEST_PLAYER_ID_2);
        });
    });

    describe('avatarImage', () => {
        beforeEach(() => {
            mockAssetsService.getAvatarStaticImage.calls.reset();
        });

        it('should return avatar image path from assetsService', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, TEST_IS_NOT_ADMIN, TEST_AVATAR);
            component.player = player;
            fixture.detectChanges();

            const result = component.avatarImage;

            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(TEST_AVATAR);
            expect(result).toBe(TEST_AVATAR_STATIC_PATH_1);
        });

        it('should return different avatar image path for different avatar', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, TEST_IS_NOT_ADMIN, TEST_AVATAR_2);
            component.player = player;
            fixture.detectChanges();

            const result = component.avatarImage;

            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(TEST_AVATAR_2);
            expect(result).toBe(TEST_AVATAR_STATIC_PATH_2);
        });

        it('should return empty string when avatar is null', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, TEST_IS_NOT_ADMIN, null);
            component.player = player;
            fixture.detectChanges();

            const result = component.avatarImage;

            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(null);
            expect(result).toBe(TEST_AVATAR_STATIC_PATH_NULL);
        });
    });
});

