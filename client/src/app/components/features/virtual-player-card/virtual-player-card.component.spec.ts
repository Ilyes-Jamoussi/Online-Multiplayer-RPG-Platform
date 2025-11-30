import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { VirtualPlayerCardComponent } from './virtual-player-card.component';

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
const TYPE_ICON_OFFENSIVE = 'local_fire_department';
const TYPE_ICON_DEFENSIVE = 'security';
const TYPE_LABEL_OFFENSIVE = 'Attaquant';
const TYPE_LABEL_DEFENSIVE = 'Défenseur';

type MockPlayerService = {
    isAdmin: Signal<boolean>;
};

type MockAssetsService = {
    getAvatarStaticImage: jasmine.Spy;
};

type MockSessionService = {
    kickPlayer: jasmine.Spy;
};

const createMockPlayer = (
    id: string,
    name: string,
    virtualPlayerType: VirtualPlayerType,
    avatar: Avatar | null = TEST_AVATAR,
): Player => ({
    id,
    name,
    avatar,
    isAdmin: TEST_IS_NOT_ADMIN,
    baseHealth: TEST_BASE_HEALTH,
    healthBonus: TEST_HEALTH_BONUS,
    health: TEST_HEALTH,
    maxHealth: TEST_MAX_HEALTH,
    baseSpeed: TEST_BASE_SPEED,
    speedBonus: TEST_SPEED_BONUS,
    speed: TEST_SPEED,
    boatSpeedBonus: TEST_BOAT_SPEED_BONUS,
    boatSpeed: TEST_BOAT_SPEED,
    baseAttack: TEST_BASE_ATTACK,
    attackBonus: TEST_ATTACK_BONUS,
    baseDefense: TEST_BASE_DEFENSE,
    defenseBonus: TEST_DEFENSE_BONUS,
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
    virtualPlayerType,
});

describe('VirtualPlayerCardComponent', () => {
    let component: VirtualPlayerCardComponent;
    let fixture: ComponentFixture<VirtualPlayerCardComponent>;
    let mockPlayerService: MockPlayerService;
    let mockAssetsService: MockAssetsService;
    let mockSessionService: MockSessionService;
    let isAdminSignal: ReturnType<typeof signal<boolean>>;

    beforeEach(async () => {
        isAdminSignal = signal<boolean>(TEST_IS_NOT_ADMIN);

        mockPlayerService = {
            isAdmin: isAdminSignal.asReadonly(),
        };

        mockAssetsService = {
            getAvatarStaticImage: jasmine.createSpy('getAvatarStaticImage').and.callFake((avatar: Avatar | null) => {
                if (avatar === TEST_AVATAR) return TEST_AVATAR_STATIC_PATH_1;
                if (avatar === TEST_AVATAR_2) return TEST_AVATAR_STATIC_PATH_2;
                return TEST_AVATAR_STATIC_PATH_NULL;
            }),
        };

        mockSessionService = {
            kickPlayer: jasmine.createSpy('kickPlayer'),
        };

        await TestBed.configureTestingModule({
            imports: [VirtualPlayerCardComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: SessionService, useValue: mockSessionService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VirtualPlayerCardComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('avatarImage', () => {
        beforeEach(() => {
            mockAssetsService.getAvatarStaticImage.calls.reset();
        });

        it('should return avatar image path from assetsService', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Offensive, TEST_AVATAR);
            component.player = player;
            fixture.detectChanges();

            const result = component.avatarImage;

            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(TEST_AVATAR);
            expect(result).toBe(TEST_AVATAR_STATIC_PATH_1);
        });

        it('should return different avatar image path for different avatar', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Offensive, TEST_AVATAR_2);
            component.player = player;
            fixture.detectChanges();

            const result = component.avatarImage;

            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(TEST_AVATAR_2);
            expect(result).toBe(TEST_AVATAR_STATIC_PATH_2);
        });

        it('should return empty string when avatar is null', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Offensive, null);
            component.player = player;
            fixture.detectChanges();

            const result = component.avatarImage;

            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(null);
            expect(result).toBe(TEST_AVATAR_STATIC_PATH_NULL);
        });
    });

    describe('showRemoveButton', () => {
        it('should return true when player is admin', () => {
            isAdminSignal.set(TEST_IS_ADMIN);
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Offensive);
            component.player = player;
            fixture.detectChanges();

            const result = component.showRemoveButton;

            expect(result).toBe(true);
        });

        it('should return false when player is not admin', () => {
            isAdminSignal.set(TEST_IS_NOT_ADMIN);
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Offensive);
            component.player = player;
            fixture.detectChanges();

            const result = component.showRemoveButton;

            expect(result).toBe(false);
        });
    });

    describe('removeVirtualPlayer', () => {
        it('should call sessionService.kickPlayer with player id', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Offensive);
            component.player = player;
            fixture.detectChanges();

            component.removeVirtualPlayer();

            expect(mockSessionService.kickPlayer).toHaveBeenCalledTimes(1);
            expect(mockSessionService.kickPlayer).toHaveBeenCalledWith(TEST_PLAYER_ID_1);
        });

        it('should call sessionService.kickPlayer with different player id', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2, VirtualPlayerType.Defensive);
            component.player = player;
            fixture.detectChanges();

            component.removeVirtualPlayer();

            expect(mockSessionService.kickPlayer).toHaveBeenCalledTimes(1);
            expect(mockSessionService.kickPlayer).toHaveBeenCalledWith(TEST_PLAYER_ID_2);
        });
    });

    describe('getTypeIcon', () => {
        it('should return "local_fire_department" for Offensive type', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Offensive);
            component.player = player;
            fixture.detectChanges();

            const result = component.getTypeIcon();

            expect(result).toBe(TYPE_ICON_OFFENSIVE);
        });

        it('should return "security" for Defensive type', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Defensive);
            component.player = player;
            fixture.detectChanges();

            const result = component.getTypeIcon();

            expect(result).toBe(TYPE_ICON_DEFENSIVE);
        });
    });

    describe('getTypeLabel', () => {
        it('should return "Attaquant" for Offensive type', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Offensive);
            component.player = player;
            fixture.detectChanges();

            const result = component.getTypeLabel();

            expect(result).toBe(TYPE_LABEL_OFFENSIVE);
        });

        it('should return "Défenseur" for Defensive type', () => {
            const player = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, VirtualPlayerType.Defensive);
            component.player = player;
            fixture.detectChanges();

            const result = component.getTypeLabel();

            expect(result).toBe(TYPE_LABEL_DEFENSIVE);
        });
    });
});

