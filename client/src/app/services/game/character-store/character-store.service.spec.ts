import { TestBed } from '@angular/core/testing';
import { CharacterStoreService } from './character-store.service';

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
        expect(character.attributes.life).toBe(4);
        expect(character.attributes.speed).toBe(4);
    });

    it('should update name', () => {
        service.setName('Test Hero');
        expect(service.character().name).toBe('Test Hero');
    });

    it('should select avatar', () => {
        service.selectAvatar(5);
        expect(service.character().avatar).toBe(5);
    });

    it('should update bonus and attributes', () => {
        service.setBonus('life');
        const character = service.character();
        expect(character.bonus).toBe('life');
        expect(character.attributes.life).toBe(6);
        expect(character.attributes.speed).toBe(4);
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
        expect(['life', 'speed']).toContain(character.bonus!);
    });

    it('should reset form', () => {
        service.setName('Test');
        service.selectAvatar(3);
        service.setBonus('speed');
        
        service.resetForm();
        
        const character = service.character();
        expect(character.name).toBe('');
        expect(character.avatar).toBe(0);
        expect(character.bonus).toBeNull();
    });
});
