/* eslint-disable max-lines -- Test file */
import { Location } from '@angular/common';
import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CHARACTER_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@app/constants/validation.constants';
import { BonusType } from '@app/enums/character-creation.enum';
import { ROUTES } from '@app/enums/routes.enum';
import { AssetsService } from '@app/services/assets/assets.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';
import { AvatarAssignment } from '@common/interfaces/session.interface';
import { CharacterCreationPageComponent } from './character-creation-page.component';

const TEST_PLAYER_ID = 'test-player-id';
const TEST_PLAYER_NAME = 'Test Player';
const TEST_PLAYER_HEALTH = 4;
const TEST_PLAYER_SPEED = 3;
const TEST_BASE_HEALTH = 4;
const TEST_HEALTH_BONUS = 0;
const TEST_HEALTH_BONUS_SELECTED = 2;
const TEST_MAX_HEALTH = 4;
const TEST_BASE_SPEED = 3;
const TEST_SPEED_BONUS = 0;
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
const TEST_IS_IN_GAME = false;
const TEST_DICE_IMAGE_PATH_D4 = './assets/images/dice/d4.svg';
const TEST_DICE_IMAGE_PATH_D6 = './assets/images/dice/d6.svg';
const TEST_IS_ADMIN = true;
const TEST_IS_NOT_ADMIN = false;
const TEST_IS_CONNECTED = true;
const TEST_IS_NOT_CONNECTED = false;
const TEST_ERROR_TITLE = 'Session expirée';
const TEST_ERROR_MESSAGE = 'Veuillez rejoindre une session.';

type MockPlayerService = {
    player: Signal<Player>;
    avatar: Signal<Avatar | null>;
    isConnected: jasmine.Spy;
    isAdmin: Signal<boolean>;
    name: Signal<string>;
    health: Signal<number>;
    speed: Signal<number>;
    isLifeBonusSelected: Signal<boolean>;
    isSpeedBonusSelected: Signal<boolean>;
    attackDice: Signal<Dice>;
    defenseDice: Signal<Dice>;
    setName: jasmine.Spy;
    setBonus: jasmine.Spy;
    setDice: jasmine.Spy;
    generateRandom: jasmine.Spy;
    createSession: jasmine.Spy;
    joinSession: jasmine.Spy;
    leaveAvatarSelection: jasmine.Spy;
};

type MockSessionService = {
    avatarAssignments: Signal<AvatarAssignment[]>;
};

const CREATE_MOCK_PLAYER = (hasBonus: boolean = true): Player => ({
    id: TEST_PLAYER_ID,
    name: TEST_PLAYER_NAME,
    avatar: Avatar.Avatar1,
    isAdmin: TEST_IS_NOT_ADMIN,
    baseHealth: TEST_BASE_HEALTH,
    healthBonus: hasBonus ? TEST_HEALTH_BONUS_SELECTED : TEST_HEALTH_BONUS,
    health: TEST_PLAYER_HEALTH,
    maxHealth: TEST_MAX_HEALTH,
    baseSpeed: TEST_BASE_SPEED,
    speedBonus: hasBonus ? TEST_SPEED_BONUS : TEST_SPEED_BONUS,
    speed: TEST_PLAYER_SPEED,
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

describe('CharacterCreationPageComponent', () => {
    let component: CharacterCreationPageComponent;
    let fixture: ComponentFixture<CharacterCreationPageComponent>;
    let mockPlayerService: MockPlayerService;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockNotificationCoordinatorService: jasmine.SpyObj<NotificationService>;
    let mockLocation: jasmine.SpyObj<Location>;
    let isAdminSignal: ReturnType<typeof signal<boolean>>;
    let nameSignal: ReturnType<typeof signal<string>>;
    let healthSignal: ReturnType<typeof signal<number>>;
    let speedSignal: ReturnType<typeof signal<number>>;
    let isLifeBonusSelectedSignal: ReturnType<typeof signal<boolean>>;
    let isSpeedBonusSelectedSignal: ReturnType<typeof signal<boolean>>;
    let attackDiceSignal: ReturnType<typeof signal<Dice>>;
    let defenseDiceSignal: ReturnType<typeof signal<Dice>>;
    let playerSignal: ReturnType<typeof signal<Player>>;
    let avatarSignal: ReturnType<typeof signal<Avatar | null>>;
    let mockSessionService: MockSessionService;
    let avatarAssignmentsSignal: ReturnType<typeof signal<AvatarAssignment[]>>;

    beforeEach(async () => {
        const mockPlayer = CREATE_MOCK_PLAYER(true);
        playerSignal = signal<Player>(mockPlayer);
        avatarSignal = signal<Avatar | null>(Avatar.Avatar1);
        isAdminSignal = signal<boolean>(TEST_IS_NOT_ADMIN);
        nameSignal = signal<string>(TEST_PLAYER_NAME);
        healthSignal = signal<number>(TEST_PLAYER_HEALTH);
        speedSignal = signal<number>(TEST_PLAYER_SPEED);
        isLifeBonusSelectedSignal = signal<boolean>(false);
        isSpeedBonusSelectedSignal = signal<boolean>(false);
        attackDiceSignal = signal<Dice>(Dice.D6);
        defenseDiceSignal = signal<Dice>(Dice.D6);

        const mockAvatarAssignments: AvatarAssignment[] = [
            { avatar: Avatar.Avatar1, chosenBy: null },
            { avatar: Avatar.Avatar2, chosenBy: null },
        ];
        avatarAssignmentsSignal = signal<AvatarAssignment[]>(mockAvatarAssignments);
        mockSessionService = {
            avatarAssignments: avatarAssignmentsSignal.asReadonly(),
        };

        mockPlayerService = {
            player: playerSignal.asReadonly(),
            avatar: avatarSignal.asReadonly(),
            isConnected: jasmine.createSpy('isConnected').and.returnValue(TEST_IS_CONNECTED),
            isAdmin: isAdminSignal.asReadonly(),
            name: nameSignal.asReadonly(),
            health: healthSignal.asReadonly(),
            speed: speedSignal.asReadonly(),
            isLifeBonusSelected: isLifeBonusSelectedSignal.asReadonly(),
            isSpeedBonusSelected: isSpeedBonusSelectedSignal.asReadonly(),
            attackDice: attackDiceSignal.asReadonly(),
            defenseDice: defenseDiceSignal.asReadonly(),
            setName: jasmine.createSpy('setName'),
            setBonus: jasmine.createSpy('setBonus'),
            setDice: jasmine.createSpy('setDice'),
            generateRandom: jasmine.createSpy('generateRandom'),
            createSession: jasmine.createSpy('createSession'),
            joinSession: jasmine.createSpy('joinSession'),
            leaveAvatarSelection: jasmine.createSpy('leaveAvatarSelection'),
        };

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getDiceImage', 'getAvatarStaticImage', 'getAvatarAnimatedImage']);
        mockAssetsService.getDiceImage.and.callFake((dice: Dice) => {
            if (dice === Dice.D4) return TEST_DICE_IMAGE_PATH_D4;
            return TEST_DICE_IMAGE_PATH_D6;
        });
        mockAssetsService.getAvatarStaticImage.and.returnValue('./assets/images/avatars/static/avatar1.png');
        mockAssetsService.getAvatarAnimatedImage.and.returnValue('./assets/images/avatars/animated/avatar1.gif');

        mockNotificationCoordinatorService = jasmine.createSpyObj('NotificationService', ['displayErrorPopup']);

        mockLocation = jasmine.createSpyObj('Location', ['back']);

        await TestBed.configureTestingModule({
            imports: [CharacterCreationPageComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: SessionService, useValue: mockSessionService },
                { provide: NotificationService, useValue: mockNotificationCoordinatorService },
                { provide: Location, useValue: mockLocation },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterCreationPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Component properties', () => {
        it('should have dice enum', () => {
            expect(component.dice).toBe(Dice);
        });

        it('should have bonusType enum', () => {
            expect(component.bonusType).toBe(BonusType);
        });

        it('should have characterNameMinLength constant', () => {
            expect(component.characterNameMinLength).toBe(NAME_MIN_LENGTH);
        });

        it('should have characterNameMaxLength constant', () => {
            expect(component.characterNameMaxLength).toBe(CHARACTER_NAME_MAX_LENGTH);
        });
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

    describe('isLifeBonusSelected', () => {
        it('should return true when life bonus is selected', () => {
            isLifeBonusSelectedSignal.set(true);
            fixture.detectChanges();

            expect(component.isLifeBonusSelected).toBe(true);
        });

        it('should return false when life bonus is not selected', () => {
            isLifeBonusSelectedSignal.set(false);
            fixture.detectChanges();

            expect(component.isLifeBonusSelected).toBe(false);
        });
    });

    describe('isSpeedBonusSelected', () => {
        it('should return true when speed bonus is selected', () => {
            isSpeedBonusSelectedSignal.set(true);
            fixture.detectChanges();

            expect(component.isSpeedBonusSelected).toBe(true);
        });

        it('should return false when speed bonus is not selected', () => {
            isSpeedBonusSelectedSignal.set(false);
            fixture.detectChanges();

            expect(component.isSpeedBonusSelected).toBe(false);
        });
    });

    describe('isAttackD4Selected', () => {
        it('should return true when attack dice is D4', () => {
            attackDiceSignal.set(Dice.D4);
            fixture.detectChanges();

            expect(component.isAttackD4Selected).toBe(true);
        });

        it('should return false when attack dice is not D4', () => {
            attackDiceSignal.set(Dice.D6);
            fixture.detectChanges();

            expect(component.isAttackD4Selected).toBe(false);
        });
    });

    describe('isAttackD6Selected', () => {
        it('should return true when attack dice is D6', () => {
            attackDiceSignal.set(Dice.D6);
            fixture.detectChanges();

            expect(component.isAttackD6Selected).toBe(true);
        });

        it('should return false when attack dice is not D6', () => {
            attackDiceSignal.set(Dice.D4);
            fixture.detectChanges();

            expect(component.isAttackD6Selected).toBe(false);
        });
    });

    describe('isDefenseD4Selected', () => {
        it('should return true when defense dice is D4', () => {
            defenseDiceSignal.set(Dice.D4);
            fixture.detectChanges();

            expect(component.isDefenseD4Selected).toBe(true);
        });

        it('should return false when defense dice is not D4', () => {
            defenseDiceSignal.set(Dice.D6);
            fixture.detectChanges();

            expect(component.isDefenseD4Selected).toBe(false);
        });
    });

    describe('isDefenseD6Selected', () => {
        it('should return true when defense dice is D6', () => {
            defenseDiceSignal.set(Dice.D6);
            fixture.detectChanges();

            expect(component.isDefenseD6Selected).toBe(true);
        });

        it('should return false when defense dice is not D6', () => {
            defenseDiceSignal.set(Dice.D4);
            fixture.detectChanges();

            expect(component.isDefenseD6Selected).toBe(false);
        });
    });

    describe('canCreateCharacter', () => {
        it('should return true when player has valid name, avatar, and bonus', () => {
            const validPlayer = CREATE_MOCK_PLAYER(true);
            playerSignal.set(validPlayer);
            fixture.detectChanges();

            expect(component.canCreateCharacter).toBe(true);
        });

        it('should return false when player has no bonus selected', () => {
            const invalidPlayer = CREATE_MOCK_PLAYER(false);
            playerSignal.set(invalidPlayer);
            fixture.detectChanges();

            expect(component.canCreateCharacter).toBe(false);
        });

        it('should return false when player has no avatar selected', () => {
            const invalidPlayer = CREATE_MOCK_PLAYER(true);
            invalidPlayer.avatar = null;
            playerSignal.set(invalidPlayer);
            fixture.detectChanges();

            expect(component.canCreateCharacter).toBe(false);
        });

        it('should return false when player has invalid name', () => {
            const invalidPlayer = CREATE_MOCK_PLAYER(true);
            invalidPlayer.name = 'AB';
            playerSignal.set(invalidPlayer);
            fixture.detectChanges();

            expect(component.canCreateCharacter).toBe(false);
        });
    });

    describe('isPlayerAdmin', () => {
        it('should return true when player is admin', () => {
            isAdminSignal.set(TEST_IS_ADMIN);
            fixture.detectChanges();

            expect(component.isPlayerAdmin).toBe(true);
        });

        it('should return false when player is not admin', () => {
            isAdminSignal.set(TEST_IS_NOT_ADMIN);
            fixture.detectChanges();

            expect(component.isPlayerAdmin).toBe(false);
        });
    });

    describe('playerName', () => {
        it('should return player name from playerService', () => {
            nameSignal.set(TEST_PLAYER_NAME);
            fixture.detectChanges();

            expect(component.playerName).toBe(TEST_PLAYER_NAME);
        });
    });

    describe('playerHealth', () => {
        it('should return player health from playerService', () => {
            healthSignal.set(TEST_PLAYER_HEALTH);
            fixture.detectChanges();

            expect(component.playerHealth).toBe(TEST_PLAYER_HEALTH);
        });
    });

    describe('playerSpeed', () => {
        it('should return player speed from playerService', () => {
            speedSignal.set(TEST_PLAYER_SPEED);
            fixture.detectChanges();

            expect(component.playerSpeed).toBe(TEST_PLAYER_SPEED);
        });
    });

    describe('getDiceImage', () => {
        it('should return dice image path for D4', () => {
            const result = component.getDiceImage(Dice.D4);

            expect(mockAssetsService.getDiceImage).toHaveBeenCalledOnceWith(Dice.D4);
            expect(result).toBe(TEST_DICE_IMAGE_PATH_D4);
        });

        it('should return dice image path for D6', () => {
            const result = component.getDiceImage(Dice.D6);

            expect(mockAssetsService.getDiceImage).toHaveBeenCalledOnceWith(Dice.D6);
            expect(result).toBe(TEST_DICE_IMAGE_PATH_D6);
        });
    });

    describe('onNameChange', () => {
        it('should call playerService.setName with name', () => {
            const newName = 'New Player Name';
            component.onNameChange(newName);

            expect(mockPlayerService.setName).toHaveBeenCalledOnceWith(newName);
        });
    });

    describe('onBonusChange', () => {
        it('should call playerService.setBonus with Life bonus', () => {
            component.onBonusChange(BonusType.Life);

            expect(mockPlayerService.setBonus).toHaveBeenCalledOnceWith(BonusType.Life);
        });

        it('should call playerService.setBonus with Speed bonus', () => {
            component.onBonusChange(BonusType.Speed);

            expect(mockPlayerService.setBonus).toHaveBeenCalledOnceWith(BonusType.Speed);
        });
    });

    describe('onAttackDiceChange', () => {
        it('should call playerService.setDice with attack and D4', () => {
            component.onAttackDiceChange(Dice.D4);

            expect(mockPlayerService.setDice).toHaveBeenCalledOnceWith('attack', Dice.D4);
        });

        it('should call playerService.setDice with attack and D6', () => {
            component.onAttackDiceChange(Dice.D6);

            expect(mockPlayerService.setDice).toHaveBeenCalledOnceWith('attack', Dice.D6);
        });
    });

    describe('onDefenseDiceChange', () => {
        it('should call playerService.setDice with defense and D4', () => {
            component.onDefenseDiceChange(Dice.D4);

            expect(mockPlayerService.setDice).toHaveBeenCalledOnceWith('defense', Dice.D4);
        });

        it('should call playerService.setDice with defense and D6', () => {
            component.onDefenseDiceChange(Dice.D6);

            expect(mockPlayerService.setDice).toHaveBeenCalledOnceWith('defense', Dice.D6);
        });
    });

    describe('generateRandomCharacter', () => {
        it('should call playerService.generateRandom', () => {
            component.generateRandomCharacter();

            expect(mockPlayerService.generateRandom).toHaveBeenCalledTimes(1);
        });
    });

    describe('onSubmit', () => {
        it('should call playerService.createSession when player is admin', () => {
            isAdminSignal.set(TEST_IS_ADMIN);
            fixture.detectChanges();

            component.onSubmit();

            expect(mockPlayerService.createSession).toHaveBeenCalledTimes(1);
            expect(mockPlayerService.joinSession).not.toHaveBeenCalled();
        });

        it('should call playerService.joinSession when player is not admin', () => {
            isAdminSignal.set(TEST_IS_NOT_ADMIN);
            fixture.detectChanges();

            component.onSubmit();

            expect(mockPlayerService.joinSession).toHaveBeenCalledTimes(1);
            expect(mockPlayerService.createSession).not.toHaveBeenCalled();
        });
    });

    describe('onBack', () => {
        it('should call playerService.leaveAvatarSelection and location.back', () => {
            component.onBack();

            expect(mockPlayerService.leaveAvatarSelection).toHaveBeenCalledTimes(1);
            expect(mockLocation.back).toHaveBeenCalledTimes(1);
        });
    });
});
