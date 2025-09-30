import { TestBed } from '@angular/core/testing';
import { CHARACTER_AVATARS_COUNT, CHARACTER_BASE, CHARACTER_PLUS } from '@app/constants/character.constants';
import { CharacterStoreService } from './character-store.service';
import { BonusType, DiceType } from '@common/enums/character-creation.enum';

const EXPECTED_LIFE_BASE = CHARACTER_BASE;
const EXPECTED_SPEED_BASE = CHARACTER_BASE;
const EXPECTED_LIFE_BONUS = CHARACTER_BASE + CHARACTER_PLUS;
const TEST_AVATAR_INDEX = 5;

describe('CharacterStoreService', () => {
    let service: CharacterStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CharacterStoreService],
        });
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
        expect(character.diceAssignment.attack).toBe(DiceType.D4);
        expect(character.diceAssignment.defense).toBe(DiceType.D6);
        expect(character.attributes.life).toBe(EXPECTED_LIFE_BASE);
        expect(character.attributes.speed).toBe(EXPECTED_SPEED_BASE);
    });

    it('should update name', () => {
        service.name = 'Test Hero';
        expect(service.character().name).toBe('Test Hero');
    });

    it('should select avatar', () => {
        service.avatar = TEST_AVATAR_INDEX;
        expect(service.character().avatar).toBe(TEST_AVATAR_INDEX);
    });

    it('should update bonus and attributes', () => {
        service.bonus = BonusType.Life;
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

    it('should generate random character', () => {
        service.generateRandom();
        const character = service.character();

        expect(character.name.length).toBeGreaterThan(0);
        expect(character.avatar).toBeGreaterThanOrEqual(0);
        expect(character.bonus).not.toBeNull();
        if (character.bonus) {
            expect([BonusType.Life, BonusType.Speed]).toContain(character.bonus);
        }
    });

    it('should expose avatars array from constant', () => {
        const avatars = service.avatars;
        const expected = Array.from({ length: CHARACTER_AVATARS_COUNT }, (_, i) => i);
        expect(avatars.length).toBe(CHARACTER_AVATARS_COUNT);
        expect(avatars).toEqual(expected);
    });

    it('should ignore invalid indices', () => {
        service.avatar = -1;
        expect(service.character().avatar).toBeNull();
        service.avatar = CHARACTER_AVATARS_COUNT;
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

    it('should allow selecting first and last avatar indices', () => {
        service.avatar = 0;
        expect(service.character().avatar).toBe(0);

        const lastIndex = CHARACTER_AVATARS_COUNT - 1;
        service.avatar = lastIndex;
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

        expect(character.diceAssignment.defense).toBe(DiceType.D6);
        expect(character.diceAssignment.attack).toBe(DiceType.D4);
    });

    it('should update attributes when bonus is speed', () => {
        service.bonus = BonusType.Speed;
        const c = service.character();
        expect(c.attributes.life).toBe(CHARACTER_BASE);
        expect(c.attributes.speed).toBe(CHARACTER_BASE + CHARACTER_PLUS);
    });

    it('should set dice assignment when setting defense to D4', () => {
        service.setDice('defense', DiceType.D4);
        const c = service.character();
        expect(c.diceAssignment.defense).toBe(DiceType.D4);
        expect(c.diceAssignment.attack).toBe(DiceType.D6);
    });

    it('generateRandom should set bonus to speed when random >= threshold', () => {
        const rName = 0.2;
        const rAvatar = 0.3;
        const rBonus = 0.9;
        const rDice = 0.2;
        spyOn(Math, 'random').and.returnValues(rName, rAvatar, rBonus, rDice);

        service.generateRandom();
        expect(service.character().bonus).toBe(BonusType.Speed);
    });
});
