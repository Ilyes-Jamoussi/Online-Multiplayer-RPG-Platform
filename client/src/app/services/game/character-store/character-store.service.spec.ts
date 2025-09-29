import { TestBed } from '@angular/core/testing';
import { CHARACTER_AVATARS_COUNT, CHARACTER_BASE, CHARACTER_PLUS } from '@app/constants/character.constants';
import { BonusType, DiceType } from '@common/enums/character-creation.enum';
import { CharacterStoreService } from './character-store.service';

const EXPECTED_LIFE_BASE = CHARACTER_BASE;
const EXPECTED_SPEED_BASE = CHARACTER_BASE;
const EXPECTED_LIFE_BONUS = CHARACTER_BASE + CHARACTER_PLUS;
const TEST_AVATAR_INDEX = 5;
const TEST_AVATAR_RESET = 3;

describe('CharacterStoreService', () => {
    let service: CharacterStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CharacterStoreService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default values', () => {
        const character = service.character();
        expect(character.name).toBe('');
        expect(character.avatar).toBeNull();
        expect(character.bonus).toBeNull();
        expect(character.diceAssignment.attack).toBe('D4');
        expect(character.diceAssignment.defense).toBe('D6');
        expect(character.attributes.life).toBe(EXPECTED_LIFE_BASE);
        expect(character.attributes.speed).toBe(EXPECTED_SPEED_BASE);
    });

    it('should update name', () => {
        service.setName('Test Hero');
        expect(service.character().name).toBe('Test Hero');
    });

    it('should select avatar', () => {
        service.selectAvatar(TEST_AVATAR_INDEX);
        expect(service.character().avatar).toBe(TEST_AVATAR_INDEX);
    });

    it('should update bonus and attributes', () => {
        service.setBonus(BonusType.Life);
        const character = service.character();
        expect(character.bonus).toBe(BonusType.Life);
        expect(character.attributes.life).toBe(EXPECTED_LIFE_BONUS);
        expect(character.attributes.speed).toBe(EXPECTED_SPEED_BASE);
    });

    it('should set dice assignment', () => {
        service.setDice('attack', DiceType.D6);
        const character = service.character();
        expect(character.diceAssignment.attack).toBe(DiceType.D6);
        expect(character.diceAssignment.defense).toBe(DiceType.D4);
    });

    it('should validate character correctly', () => {
        expect(service.isValid).toBeFalse();

        service.setName('Hero');
        service.setBonus(BonusType.Life);
        service.selectAvatar(0);
        expect(service.isValid).toBeTrue();
    });

    it('should generate random character', () => {
        service.generateRandom();
        const character = service.character();

        expect(character.name.length).toBeGreaterThan(0);
        expect(character.avatar).toBeGreaterThanOrEqual(0);
        expect(character.bonus).not.toBeNull();
        if (character.bonus) {
            expect(['life', 'speed']).toContain(character.bonus);
        }
    });

    it('should reset form', () => {
        service.setName('Test');
        service.selectAvatar(TEST_AVATAR_RESET);
        service.setBonus(BonusType.Speed);

        service.resetForm();

        const character = service.character();
        expect(character.name).toBe('');
        expect(character.avatar).toBe(0);
        expect(character.bonus).toBeNull();
    });

    it('should expose avatars array from constant', () => {
        const avatars = service.avatars;
        const expected = Array.from({ length: CHARACTER_AVATARS_COUNT }, (_, i) => i);
        expect(avatars.length).toBe(CHARACTER_AVATARS_COUNT);
        expect(avatars).toEqual(expected);
    });

    it('should reset avatar to null with resetAvatar and ignore invalid indices', () => {
        service.selectAvatar(TEST_AVATAR_INDEX);
        expect(service.character().avatar).toBe(TEST_AVATAR_INDEX);
        service.resetAvatar();
        expect(service.character().avatar).toBeNull();

        service.selectAvatar(-1);
        expect(service.character().avatar).toBeNull();
        service.selectAvatar(CHARACTER_AVATARS_COUNT);
        expect(service.character().avatar).toBeNull();
    });

    it('should set dice assignment when setting defense (other branch)', () => {
        service.setDice('defense', DiceType.D6);
        const character = service.character();
        expect(character.diceAssignment.defense).toBe(DiceType.D6);
        expect(character.diceAssignment.attack).toBe(DiceType.D4);
    });

    it('should set dice assignment correctly for attack variants', () => {
        service.setDice('attack', DiceType.D4);
        let character = service.character();
        expect(character.diceAssignment.attack).toBe(DiceType.D4);
        expect(character.diceAssignment.defense).toBe(DiceType.D6);

        service.setDice('attack', DiceType.D6);
        character = service.character();
        expect(character.diceAssignment.attack).toBe(DiceType.D6);
        expect(character.diceAssignment.defense).toBe(DiceType.D4);
    });

    it('resetForm should restore default dice assignment', () => {
        service.setDice('attack', DiceType.D6);
        expect(service.character().diceAssignment.attack).toBe(DiceType.D6);

        service.resetForm();
        const character = service.character();
        expect(character.diceAssignment.attack).toBe('D4');
        expect(character.diceAssignment.defense).toBe('D6');
    });

    it('should allow selecting first and last avatar indices', () => {
        service.selectAvatar(0);
        expect(service.character().avatar).toBe(0);

        const lastIndex = CHARACTER_AVATARS_COUNT - 1;
        service.selectAvatar(lastIndex);
        expect(service.character().avatar).toBe(lastIndex);
    });

    it('generateRandom should set predictable values when Math.random is stubbed', () => {
        const randName = 0.01;
        const randAvatar = 0.23;
        const randBonus = 0.1;
        const randDice = 0.9;

        spyOn(Math, 'random').and.returnValues(randName, randAvatar, randBonus, randDice);

        service.generateRandom();

        const character = service.character();

        const expectedAvatar = Math.floor(randAvatar * CHARACTER_AVATARS_COUNT);
        expect(character.avatar).toBe(expectedAvatar);

        expect(character.bonus).toBe(BonusType.Life);

        expect(character.diceAssignment.defense).toBe('D6');
        expect(character.diceAssignment.attack).toBe('D4');
    });

    it('should return appropriate nameError messages for empty, too long and invalid names', () => {
        service.setName('');
        expect(service.nameError).toBe('Le nom est requis');

        let longName = 'a';
        service.setName(longName);
        while (service.isNameValid) {
            longName += 'a';
            service.setName(longName);
            if (!service.isNameValid) break;
        }
        expect(service.nameError).toBe('Maximum 8 caractères');

        service.setName('inv@lid');
        expect(service.nameError).toBe('Lettres et chiffres seulement');

        const validName = longName.slice(0, -1);
        service.setName(validName);
        expect(service.isNameValid).toBeTrue();
        expect(service.nameError).toBeNull();
    });

    it('should update attributes when bonus is speed', () => {
        service.setBonus('speed');
        const c = service.character();
        expect(c.attributes.life).toBe(CHARACTER_BASE);
        expect(c.attributes.speed).toBe(CHARACTER_BASE + CHARACTER_PLUS);
    });

    it('should set dice assignment when setting defense to D4', () => {
        service.setDice('defense', 'D4');
        const c = service.character();
        expect(c.diceAssignment.defense).toBe('D4');
        expect(c.diceAssignment.attack).toBe('D6');
    });

    it('generateRandom should set bonus to speed when random >= threshold', () => {
        const rName = 0.2;
        const rAvatar = 0.3;
        const rBonus = 0.9;
        const rDice = 0.2;
        spyOn(Math, 'random').and.returnValues(rName, rAvatar, rBonus, rDice);

        service.generateRandom();
        expect(service.character().bonus).toBe('speed');
    });
});
