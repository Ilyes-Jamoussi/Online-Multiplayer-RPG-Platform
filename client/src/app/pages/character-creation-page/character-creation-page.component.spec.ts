import { TestBed } from '@angular/core/testing';
import { CharacterCreationPageComponent } from './character-creation-page.component';

import { AssetsService } from '@app/services/assets/assets.service';
import { CharacterCreationCheckService } from '@app/services/character-creation-check/character-creation-check.service';
import { CharacterStoreService } from '@app/services/character-store/character-store.service';
import { NotificationService } from '@app/services/notification/notification.service';

import { BonusType, DiceType } from '@common/enums/character-creation.enum';
import { Character } from '@common/interfaces/character.interface';
import { Signal } from '@angular/core';
import { CHARACTER_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@app/constants/validation.constants';

const AVATAR_COUNT = 12;
const STAT_BASE = 10;
const STAT_BONUS = 2;

function createCharacterStoreSpy(avatarCount = AVATAR_COUNT) {
    let state: Character = {
        name: '',
        avatar: null,
        bonus: null,
        diceAssignment: { attack: DiceType.D4, defense: DiceType.D6 },
        attributes: { life: 10, speed: 10 },
    };

    const characterSignalSpy = jasmine.createSpy('character').and.callFake(() => state) as unknown as Signal<Character>;

    const storeSpy = jasmine.createSpyObj<CharacterStoreService>('CharacterStoreService', ['setDice', 'generateRandom']);

    Object.defineProperty(storeSpy, 'character', {
        get: () => characterSignalSpy,
    });

    Object.defineProperty(storeSpy, 'avatars', {
        get: () => Array.from({ length: avatarCount }, (_, i) => i),
    });

    Object.defineProperty(storeSpy, 'name', {
        set: (v: string) => {
            state = { ...state, name: v };
        },
    });

    Object.defineProperty(storeSpy, 'bonus', {
        set: (b: BonusType | null) => {
            const base = 10;
            const plus = 2;
            const life = b === BonusType.Life ? base + plus : base;
            const speed = b === BonusType.Speed ? base + plus : base;
            state = { ...state, bonus: b, attributes: { life, speed } };
        },
    });

    Object.defineProperty(storeSpy, 'avatar', {
        set: (idx: number | null) => {
            state = { ...state, avatar: idx };
        },
    });

    storeSpy.setDice.and.callFake((attr: 'attack' | 'defense', value: DiceType) => {
        if (attr === 'attack') {
            state = {
                ...state,
                diceAssignment: {
                    attack: value,
                    defense: value === DiceType.D6 ? DiceType.D4 : DiceType.D6,
                },
            };
        } else {
            state = {
                ...state,
                diceAssignment: {
                    attack: value === DiceType.D6 ? DiceType.D4 : DiceType.D6,
                    defense: value,
                },
            };
        }
    });

    storeSpy.generateRandom.and.callFake(() => {
        /** no-op */
    });

    return { storeSpy, characterSignalSpy, getState: () => state };
}

describe('CharacterCreationPageComponent', () => {
    let component: CharacterCreationPageComponent;

    let assetsServiceSpy: jasmine.SpyObj<AssetsService>;
    let creationCheckServiceSpy: jasmine.SpyObj<CharacterCreationCheckService>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

    beforeEach(() => {
        assetsServiceSpy = jasmine.createSpyObj<AssetsService>('AssetsService', [
            'getAvatarStaticImage',
            'getAvatarAnimatedImage',
            'getAvatarStaticByNumber',
            'getAvatarAnimatedByNumber',
            'getDiceImage',
            'getTileImage',
            'getPlaceableImage',
        ]);

        creationCheckServiceSpy = jasmine.createSpyObj<CharacterCreationCheckService>('CharacterCreationCheckService', [
            'canCreate',
            'getErrorMessages',
        ]);

        notificationServiceSpy = jasmine.createSpyObj<NotificationService>('NotificationService', ['displayError', 'displaySuccess']);

        const { storeSpy } = createCharacterStoreSpy(AVATAR_COUNT);

        TestBed.configureTestingModule({
            imports: [CharacterCreationPageComponent],
            providers: [
                { provide: AssetsService, useValue: assetsServiceSpy },
                { provide: CharacterCreationCheckService, useValue: creationCheckServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: CharacterStoreService, useValue: storeSpy },
            ],
        });

        TestBed.overrideComponent(CharacterCreationPageComponent, {
            set: {
                providers: [{ provide: CharacterCreationCheckService, useValue: creationCheckServiceSpy }],
            },
        });

        const fixture = TestBed.createComponent(CharacterCreationPageComponent);
        component = fixture.componentInstance;
        assetsServiceSpy.getAvatarStaticByNumber.and.callFake((n: number) => `/static/avatarS${n}.png`);
        assetsServiceSpy.getAvatarAnimatedByNumber.and.callFake((n: number) => `/anim/avatar${n}.gif`);
        assetsServiceSpy.getDiceImage.and.returnValue('/dice/d4.svg');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have correct default values', () => {
        expect(component.diceType).toBe(DiceType);
        expect(component.bonusType).toBe(BonusType);
        expect(component.hasSelectedAvatar).toBeFalse();
        expect(component.selectedAvatarAltText).toBe('');
        expect(component.avatars.length).toBe(AVATAR_COUNT);
    });

    it('should update name in store when changed', () => {
        const newName = 'New Hero Name';
        component.onNameChange(newName);
        expect(component.character.name).toBe(newName);
    });

    it('should select avatar and update selectedAvatarAltText', () => {
        const avatarIndex = 3;
        component.selectAvatar(avatarIndex);
        expect(component.character.avatar).toBe(avatarIndex);
        expect(component.selectedAvatarAltText).toBe(`Avatar sélectionné ${avatarIndex + 1}`);
        expect(component.hasSelectedAvatar).toBeTrue();
    });

    it('should change bonus and update attributes accordingly', () => {
        component.onBonusChange(BonusType.Life);
        expect(component.character.bonus).toBe(BonusType.Life);
        expect(component.character.attributes.life).toBe(STAT_BASE + STAT_BONUS);
        expect(component.character.attributes.speed).toBe(STAT_BASE);

        component.onBonusChange(BonusType.Speed);
        expect(component.character.bonus).toBe(BonusType.Speed);
        expect(component.character.attributes.life).toBe(STAT_BASE);
        expect(component.character.attributes.speed).toBe(STAT_BASE + STAT_BONUS);
    });

    it('should change attack and defense dice and update assignment accordingly', () => {
        component.onAttackDiceChange(DiceType.D6);
        expect(component.character.diceAssignment.attack).toBe(DiceType.D6);
        expect(component.character.diceAssignment.defense).toBe(DiceType.D4);

        component.onDefenseDiceChange(DiceType.D6);
        expect(component.character.diceAssignment.attack).toBe(DiceType.D4);
        expect(component.character.diceAssignment.defense).toBe(DiceType.D6);
    });

    it('should generate random character', () => {
        component.generateRandomCharacter();
        expect(component.store.generateRandom).toHaveBeenCalled();
    });

    it('should submit character if valid', () => {
        creationCheckServiceSpy.canCreate.and.returnValue(true);
        component.onSubmit();
        expect(creationCheckServiceSpy.canCreate).toHaveBeenCalled();
        expect(notificationServiceSpy.displayError).not.toHaveBeenCalled();
    });

    it('should get correct avatar image paths', () => {
        const avatarIndex = 5;
        const staticPath = component.getAvatarImage(avatarIndex);
        const animatedPath = component.selectedAvatarImage;

        expect(staticPath).toBe(`/static/avatarS${avatarIndex + 1}.png`);
        expect(animatedPath).toBe('');

        component.selectAvatar(avatarIndex);
        const animatedPathAfterSelect = component.selectedAvatarImage;
        expect(animatedPathAfterSelect).toBe(`/anim/avatar${avatarIndex + 1}.gif`);
    });

    it('should return correct aria-pressed for avatars', () => {
        const avatarIndex = 2;
        expect(component.getisAvatarSelected(avatarIndex)).toBeFalse();
        component.selectAvatar(avatarIndex);
        expect(component.getisAvatarSelected(avatarIndex)).toBeTrue();
    });

    it('should have correct character name length constants', () => {
        expect(component.characterNameMinLength).toBe(NAME_MIN_LENGTH);
        expect(component.characterNameMaxLength).toBe(CHARACTER_NAME_MAX_LENGTH);
    });

    it('should compute hasSelectedAvatar and showAvatarPlaceholder correctly', () => {
        expect(component.hasSelectedAvatar).toBeFalse();
        expect(component.showAvatarPlaceholder).toBeTrue();

        component.selectAvatar(1);
        expect(component.hasSelectedAvatar).toBeTrue();
        expect(component.showAvatarPlaceholder).toBeFalse();
    });

    it('should reflect bonus selection flags (isLifeBonusSelected / isSpeedBonusSelected)', () => {
        component.onBonusChange(BonusType.Life);
        expect(component.isLifeBonusSelected).toBeTrue();
        expect(component.isSpeedBonusSelected).toBeFalse();

        component.onBonusChange(BonusType.Speed);
        expect(component.isLifeBonusSelected).toBeFalse();
        expect(component.isSpeedBonusSelected).toBeTrue();
    });

    it('should reflect dice selection flags for attack (D4/D6)', () => {
        expect(component.isAttackD4Selected).toBeTrue();
        expect(component.isAttackD6Selected).toBeFalse();

        component.onAttackDiceChange(DiceType.D6);
        expect(component.isAttackD4Selected).toBeFalse();
        expect(component.isAttackD6Selected).toBeTrue();
    });

    it('should reflect dice selection flags for defense (D4/D6)', () => {
        expect(component.isDefenseD4Selected).toBeFalse();
        expect(component.isDefenseD6Selected).toBeTrue();

        component.onDefenseDiceChange(DiceType.D6);
        expect(component.isDefenseD4Selected).toBeFalse();
        expect(component.isDefenseD6Selected).toBeTrue();

        component.onDefenseDiceChange(DiceType.D4);
        expect(component.isDefenseD4Selected).toBeTrue();
        expect(component.isDefenseD6Selected).toBeFalse();
    });

    it('should call assetsService.getAvatarStaticByNumber with index+1 and return its value', () => {
        const idx = 4;
        const expected = `/static/avatarS${idx + 1}.png`;
        assetsServiceSpy.getAvatarStaticByNumber.and.returnValue(expected);

        const path = component.getAvatarImage(idx);

        expect(assetsServiceSpy.getAvatarStaticByNumber).toHaveBeenCalledWith(idx + 1);
        expect(path).toBe(expected);
    });

    it('should not submit character if invalid and display error payload from component', () => {
        creationCheckServiceSpy.canCreate.and.returnValue(false);

        component.onSubmit();

        expect(creationCheckServiceSpy.canCreate).toHaveBeenCalled();
        expect(notificationServiceSpy.displayError).toHaveBeenCalledWith({
            title: 'Erreur de validation',
            message: 'Nom, avatar et bonus requis.',
        });
        expect(notificationServiceSpy.displaySuccess).not.toHaveBeenCalled();
    });

    it('should submit character if valid and call displaySuccess with redirect', () => {
        creationCheckServiceSpy.canCreate.and.returnValue(true);

        component.onSubmit();

        expect(creationCheckServiceSpy.canCreate).toHaveBeenCalled();
        expect(notificationServiceSpy.displayError).not.toHaveBeenCalled();
        expect(notificationServiceSpy.displaySuccess).toHaveBeenCalled();
        const arg = notificationServiceSpy.displaySuccess.calls.mostRecent().args[0];
        expect(arg).toEqual(
            jasmine.objectContaining({
                title: 'Personnage créé',
                message: jasmine.stringMatching(/est prêt pour l’aventure\./),
                redirectRoute: 'waiting-room',
            }),
        );
    });
});
