import { TestBed } from '@angular/core/testing';
import { Signal, WritableSignal, signal } from '@angular/core';
import { NAME_MIN_LENGTH, CHARACTER_NAME_MAX_LENGTH } from '@app/constants/validation.constants';
import { CharacterCreationCheckService } from '@app/services/character-creation-check/character-creation-check.service';
import { CharacterStoreService } from '@app/services/character-store/character-store.service';
import { DiceType, BonusType } from '@common/enums/character-creation.enum';
import { Character } from '@common/interfaces/character.interface';

describe('CharacterCreationCheckService', () => {
    let service: CharacterCreationCheckService;
    let characterSig: WritableSignal<Character>;

    const baseCharacter: Character = {
        name: 'ValidName',
        avatar: 0,
        bonus: BonusType.Life,
        diceAssignment: { attack: DiceType.D4, defense: DiceType.D6 },
        attributes: { life: 1, speed: 1 },
    };

    const makeStoreMock = (): Pick<CharacterStoreService, 'character'> => ({
        get character(): Signal<Character> {
            return characterSig;
        },
    });

    beforeEach(() => {
        characterSig = signal<Character>(baseCharacter);

        TestBed.configureTestingModule({
            providers: [CharacterCreationCheckService, { provide: CharacterStoreService, useValue: makeStoreMock() }],
        });

        service = TestBed.inject(CharacterCreationCheckService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('validationProblems returns no issues for valid name and selected avatar', () => {
        characterSig.set({ ...baseCharacter, name: 'Player1', avatar: 1 });
        const problems = service['validationProblems']();
        expect(problems.nameValidation.hasIssue).toBeFalse();
        expect(problems.avatarSelection.hasIssue).toBeFalse();
        expect(service.canCreate()).toBeTrue();
        expect(service.getErrorMessages().length).toBe(0);
    });

    it('detects name too short', () => {
        const tooShort = 'a'.repeat(Math.max(0, NAME_MIN_LENGTH - 1));
        characterSig.set({ ...baseCharacter, name: tooShort });
        const problems = service['validationProblems']();
        expect(problems.nameValidation.hasIssue).toBeTrue();
        expect(typeof problems.nameValidation.message).toBe('string');
        expect(service.canCreate()).toBeFalse();
        const msgs = service.getErrorMessages();
        expect(msgs.length).toBe(1);
        expect(msgs[0]).toContain(`${NAME_MIN_LENGTH}`);
        expect(msgs[0]).toContain(`${CHARACTER_NAME_MAX_LENGTH}`);
    });

    it('detects name too long', () => {
        const tooLong = 'a'.repeat(CHARACTER_NAME_MAX_LENGTH + 1);
        characterSig.set({ ...baseCharacter, name: tooLong });
        const problems = service['validationProblems']();
        expect(problems.nameValidation.hasIssue).toBeTrue();
        expect(service.canCreate()).toBeFalse();
        const msgs = service.getErrorMessages();
        expect(msgs.length).toBe(1);
        expect(msgs[0]).toContain(`${NAME_MIN_LENGTH}`);
        expect(msgs[0]).toContain(`${CHARACTER_NAME_MAX_LENGTH}`);
    });

    it('detects no bonus selected', () => {
        characterSig.set({ ...baseCharacter, bonus: null });
        const problems = service['validationProblems']();
        expect(problems.bonusSelection.hasIssue).toBeTrue();
        expect(problems.bonusSelection.message).toBe('Un bonus doit être sélectionné.');
        expect(service.canCreate()).toBeFalse();
        const msgs = service.getErrorMessages();
        expect(msgs).toEqual(['Un bonus doit être sélectionné.']);
    });

    it('detects whitespace-only name (after trim)', () => {
        characterSig.set({ ...baseCharacter, name: '     ' });
        const problems = service['validationProblems']();
        expect(problems.nameValidation.hasIssue).toBeTrue();
        const msgs = service.getErrorMessages();
        expect(msgs.length).toBe(1);
        expect(msgs[0]).toContain(`entre ${NAME_MIN_LENGTH} et ${CHARACTER_NAME_MAX_LENGTH}`);
    });

    it('detects missing avatar', () => {
        characterSig.set({ ...baseCharacter, avatar: null });
        const problems = service['validationProblems']();
        expect(problems.avatarSelection.hasIssue).toBeTrue();
        expect(problems.avatarSelection.message).toBe('Un avatar doit être sélectionné.');
        expect(service.canCreate()).toBeFalse();
        const msgs = service.getErrorMessages();
        expect(msgs).toEqual(['Un avatar doit être sélectionné.']);
    });

    it('aggregates both errors when name invalid and avatar missing', () => {
        const tooShort = 'a'.repeat(Math.max(0, NAME_MIN_LENGTH - 1));
        characterSig.set({ ...baseCharacter, name: tooShort, avatar: null });
        const problems = service['validationProblems']();
        expect(problems.nameValidation.hasIssue).toBeTrue();
        expect(problems.avatarSelection.hasIssue).toBeTrue();
        expect(service.canCreate()).toBeFalse();
        const msgs = service.getErrorMessages();
        expect(msgs.length).toBe(2);
        expect(msgs[0]).toContain(`${NAME_MIN_LENGTH}`);
        expect(msgs[0]).toContain(`${CHARACTER_NAME_MAX_LENGTH}`);
        expect(msgs[1]).toBe('Un avatar doit être sélectionné.');
    });

    it('reacts to subsequent fixes: first invalid, then valid -> canCreate true and no messages', () => {
        characterSig.set({ ...baseCharacter, name: ' '.repeat(NAME_MIN_LENGTH - 1), avatar: null });
        expect(service.canCreate()).toBeFalse();
        expect(service.getErrorMessages().length).toBe(2);

        characterSig.set({ ...baseCharacter, name: 'Hero', avatar: 2 });
        const problems = service['validationProblems']();
        expect(problems.nameValidation.hasIssue).toBeFalse();
        expect(problems.avatarSelection.hasIssue).toBeFalse();
        expect(service.canCreate()).toBeTrue();
        expect(service.getErrorMessages().length).toBe(0);
    });
});
