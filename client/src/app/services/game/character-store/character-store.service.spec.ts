import { TestBed } from '@angular/core/testing';
import { CHARACTER_BASE, CHARACTER_PLUS } from '@app/constants/character.constants';
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
        service.setBonus('life');
        const character = service.character();
        expect(character.bonus).toBe('life');
        expect(character.attributes.life).toBe(EXPECTED_LIFE_BONUS);
        expect(character.attributes.speed).toBe(EXPECTED_SPEED_BASE);
    });

    it('should set dice assignment', () => {
        service.setDice('attack', 'D6');
        const character = service.character();
        expect(character.diceAssignment.attack).toBe('D6');
        expect(character.diceAssignment.defense).toBe('D4');
    });

    it('should validate character correctly', () => {
        expect(service.isValid()).toBeFalse();
        
        service.setName('Hero');
        service.setBonus('life');
        expect(service.isValid()).toBeTrue();
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
        service.setBonus('speed');
        
        service.resetForm();
        
        const character = service.character();
        expect(character.name).toBe('');
        expect(character.avatar).toBe(0);
        expect(character.bonus).toBeNull();
    });
});
