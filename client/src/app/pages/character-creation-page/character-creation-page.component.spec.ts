import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import {
    CHARACTER_NAME_MAX_LENGTH,
    NAME_MIN_LENGTH,
    WHITESPACE_PATTERN,
} from '@app/constants/validation.constants';
import type { CharacterForm } from '@app/interfaces/character.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { CharacterCreationCheckService } from '@app/services/character-creation-check/character-creation-check.service';
import { CharacterStoreService } from '@app/services/game/character-store/character-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { CharacterCreationPageComponent } from './character-creation-page.component';

describe('CharacterCreationPageComponent (high coverage)', () => {
    let fixture: ComponentFixture<CharacterCreationPageComponent>;
    let component: CharacterCreationPageComponent;

    const baseCharacter = {
        name: '',
        avatar: null,
        bonus: null,
        diceAssignment: { attack: 'D4', defense: 'D6' } as const,
        attributes: { life: 1, speed: 1 },
    };

    const mockCharacterStoreService = {
        character: jasmine.createSpy('character').and.returnValue(baseCharacter),
        avatars: [0, 1, 2],
        resetAvatar: jasmine.createSpy('resetAvatar'),
        setBonus: jasmine.createSpy('setBonus'),
        setName: jasmine.createSpy('setName'),
        selectAvatar: jasmine.createSpy('selectAvatar'),
        setDice: jasmine.createSpy('setDice'),
        generateRandom: jasmine.createSpy('generateRandom'),
    };

    const mockAssetsService = {
        getAvatarStaticByNumber: jasmine.createSpy('getAvatarStaticByNumber').and.callFake(n => `static-${n}`),
        getAvatarAnimatedByNumber: jasmine.createSpy('getAvatarAnimatedByNumber').and.callFake(n => `anim-${n}`),
        getDiceImage: jasmine.createSpy('getDiceImage').and.callFake((type: string, value: string) => `dice-${type}-${value}`),
    };

    const mockCharacterCreationCheckService = {
        canCreate: jasmine.createSpy('canCreate').and.returnValue(false),
    };

    const mockNotificationService = {
        displayError: jasmine.createSpy('displayError'),
        displaySuccess: jasmine.createSpy('displaySuccess'),
    };

    const mockRouter = {
        navigate: jasmine.createSpy('navigate'),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CharacterCreationPageComponent],
            providers: [
                { provide: CharacterStoreService, useValue: mockCharacterStoreService },
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: CharacterCreationCheckService, useValue: mockCharacterCreationCheckService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should instantiate and expose constants from project', () => {
        expect(component).toBeTruthy();
        expect(component.characterNameMinLength).toBe(NAME_MIN_LENGTH);
        expect(component.characterNameMaxLength).toBe(CHARACTER_NAME_MAX_LENGTH);
    });

    it('ngOnInit should reset avatar and set a default bonus', () => {
        expect(mockCharacterStoreService.resetAvatar).toHaveBeenCalled();
        expect(mockCharacterStoreService.setBonus).toHaveBeenCalledWith('life');
    });

    it('getAvatarImage and getSelectedAvatarImage use AssetsService and character state', () => {
        expect(component.getSelectedAvatarImage()).toBe('');
        expect(component.getAvatarImage(1)).toBe('static-2');

        (mockCharacterStoreService.character as jasmine.Spy).and.returnValue({ ...baseCharacter, avatar: 1 });
        expect(component.getSelectedAvatarImage()).toBe('anim-2');
    });

    it('store getter returns the injected CharacterStoreService instance', () => {
        expect(component.store).toBe(mockCharacterStoreService as unknown as CharacterStoreService);
    });

    it("getNameErrorMessage returns the 'only spaces' message when trimmed value contains only whitespace chars", () => {
        Object.defineProperty(component, 'character', {
            get: () =>
            ({
                name: { trim: () => ' '.repeat(NAME_MIN_LENGTH) },
            } as unknown as CharacterForm),
        });

        const msg = component.getNameErrorMessage();
        expect(msg).toContain('espaces');
    });

    it('getNameErrorMessage returns empty string for empty name after trim', () => {
        Object.defineProperty(component, 'character', {
            get: () => ({ name: { trim: () => '' } } as unknown as CharacterForm),
        });
        expect(component.getNameErrorMessage()).toBe('');
    });

    it('getNameErrorMessage returns empty string for a valid name', () => {
        Object.defineProperty(component, 'character', {
            get: () => ({ name: { trim: () => 'ValidName' } } as unknown as CharacterForm),
        });
        expect(component.getNameErrorMessage()).toBe('');
    });

    it('goBack uses router to navigate to gameSessionCreation', () => {
        mockRouter.navigate.calls.reset();
        component.goBack();
        expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.gameSessionCreation]);
    });

    it('onNameChange delegates to store.setName and getNameErrorMessage uses project constants', () => {
        component.onNameChange('ab');
        expect(mockCharacterStoreService.setName).toHaveBeenCalledWith('ab');

        const tooShort = 'a'.repeat(NAME_MIN_LENGTH - 1);
        (mockCharacterStoreService.character as jasmine.Spy).and.returnValue({ ...baseCharacter, name: tooShort });
        expect(component.getNameErrorMessage()).toContain(`${NAME_MIN_LENGTH}`);

        const tooLong = 'a'.repeat(CHARACTER_NAME_MAX_LENGTH + 1);
        (mockCharacterStoreService.character as jasmine.Spy).and.returnValue({ ...baseCharacter, name: tooLong });
        expect(component.getNameErrorMessage()).toContain(`${CHARACTER_NAME_MAX_LENGTH}`);

        const onlySpaces = ' '.repeat(NAME_MIN_LENGTH + 1);
        (mockCharacterStoreService.character as jasmine.Spy).and.returnValue({ ...baseCharacter, name: onlySpaces });
        expect(onlySpaces.replace(WHITESPACE_PATTERN, '').length).toBe(0);
        expect(component.getNameErrorMessage()).toBe('');
    });

    it('selectAvatar, onBonusChange, onAttackDiceChange, onDefenseDiceChange delegate to store', () => {
        component.selectAvatar(2);
        expect(mockCharacterStoreService.selectAvatar).toHaveBeenCalledWith(2);

        component.onBonusChange('speed');
        expect(mockCharacterStoreService.setBonus).toHaveBeenCalledWith('speed');

        component.onAttackDiceChange('D6');
        expect(mockCharacterStoreService.setDice).toHaveBeenCalledWith('attack', 'D6');

        component.onDefenseDiceChange('D4');
        expect(mockCharacterStoreService.setDice).toHaveBeenCalledWith('defense', 'D4');
    });

    it('generateRandomCharacter delegates to store.generateRandom', () => {
        component.generateRandomCharacter();
        expect(mockCharacterStoreService.generateRandom).toHaveBeenCalled();
    });

    it('onSubmit when cannot create -> displayError called and no success', () => {
        mockCharacterCreationCheckService.canCreate.and.returnValue(false);
        mockNotificationService.displayError.calls.reset();
        mockNotificationService.displaySuccess.calls.reset();

        (component as unknown as { characterCreationCheckService: CharacterCreationCheckService }).characterCreationCheckService =
            mockCharacterCreationCheckService as unknown as CharacterCreationCheckService;
        (component as unknown as { notificationService: NotificationService }).notificationService =
            mockNotificationService as unknown as NotificationService;

        component.onSubmit();

        expect(mockNotificationService.displayError).toHaveBeenCalled();
        expect(mockNotificationService.displaySuccess).not.toHaveBeenCalled();

        const errArg = (mockNotificationService.displayError as jasmine.Spy).calls.mostRecent().args[0];
        expect(errArg.title).toContain('Erreur');
    });

    it('onSubmit when can create -> displaySuccess called with redirect route', () => {
        mockCharacterCreationCheckService.canCreate.and.returnValue(true);
        (mockCharacterStoreService.character as jasmine.Spy).and.returnValue({ ...baseCharacter, name: 'ValidName' });

        (component as unknown as { characterCreationCheckService: CharacterCreationCheckService }).characterCreationCheckService =
            mockCharacterCreationCheckService as unknown as CharacterCreationCheckService;
        (component as unknown as { notificationService: NotificationService }).notificationService =
            mockNotificationService as unknown as NotificationService;

        component.onSubmit();

        expect(mockNotificationService.displaySuccess).toHaveBeenCalled();
        const successArg = (mockNotificationService.displaySuccess as jasmine.Spy).calls.mostRecent().args[0];
        expect(successArg.redirectRoute).toBe(ROUTES.waitingRoom);
        expect(successArg.title).toContain('Personnage');
    });

    it('onBackClick navigates to root', () => {
        component.onBackClick();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
});
