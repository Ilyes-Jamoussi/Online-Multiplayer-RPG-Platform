import { TestBed } from '@angular/core/testing';
import { CharacterCreationCheckService } from './character-creation-check.service';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';

const TEST_ERROR_COUNT = 3;

describe('CharacterCreationCheckService', () => {
    let service: CharacterCreationCheckService;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;

    const basePlayer: Player = {
        id: 'player1',
        name: '',
        avatar: null,
        isAdmin: false,
        baseHealth: 4,
        healthBonus: 0,
        health: 4,
        maxHealth: 4,
        baseSpeed: 4,
        speedBonus: 0,
        speed: 4,
        baseAttack: 4,
        attackBonus: 0,
        attack: 4,
        baseDefense: 4,
        defenseBonus: 0,
        defense: 4,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: 0,
        y: 0,
        isInGame: false,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
    };

    beforeEach(() => {
        const playerSpy = jasmine.createSpyObj('PlayerService', ['player']);

        TestBed.configureTestingModule({
            providers: [CharacterCreationCheckService, { provide: PlayerService, useValue: playerSpy }],
        });

        service = TestBed.inject(CharacterCreationCheckService);
        mockPlayerService = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('canCreate', () => {
        it('should return true when all validations pass', () => {
            const validPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(validPlayer);

            expect(service.canCreate()).toBe(true);
        });

        it('should return false when name is invalid', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: 'ab',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            expect(service.canCreate()).toBe(false);
        });

        it('should return false when avatar is not selected', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: null,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            expect(service.canCreate()).toBe(false);
        });

        it('should return false when no bonus is selected', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: Avatar.Avatar1,
                healthBonus: 0,
                speedBonus: 0,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            expect(service.canCreate()).toBe(false);
        });
    });

    describe('getErrorMessages', () => {
        it('should return empty array when all validations pass', () => {
            const validPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(validPlayer);

            expect(service.getErrorMessages()).toEqual([]);
        });

        it('should return name validation error for short name', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: 'ab',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            const errors = service.getErrorMessages();
            expect(errors).toContain("Le nom doit contenir entre 3 et 15 caractères et ne pas être composé uniquement d'espaces.");
        });

        it('should return name validation error for long name', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: 'ThisNameIsTooLongForValidation',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            const errors = service.getErrorMessages();
            expect(errors).toContain("Le nom doit contenir entre 3 et 15 caractères et ne pas être composé uniquement d'espaces.");
        });

        it('should return name validation error for whitespace-only name', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: '   ',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            const errors = service.getErrorMessages();
            expect(errors).toContain("Le nom doit contenir entre 3 et 15 caractères et ne pas être composé uniquement d'espaces.");
        });

        it('should return avatar selection error', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: null,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            const errors = service.getErrorMessages();
            expect(errors).toContain('Un avatar doit être sélectionné.');
        });

        it('should return bonus selection error', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: Avatar.Avatar1,
                healthBonus: 0,
                speedBonus: 0,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            const errors = service.getErrorMessages();
            expect(errors).toContain('Un bonus doit être sélectionné.');
        });

        it('should return multiple errors when multiple validations fail', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: 'ab',
                avatar: null,
                healthBonus: 0,
                speedBonus: 0,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            const errors = service.getErrorMessages();
            expect(errors).toContain("Le nom doit contenir entre 3 et 15 caractères et ne pas être composé uniquement d'espaces.");
            expect(errors).toContain('Un avatar doit être sélectionné.');
            expect(errors).toContain('Un bonus doit être sélectionné.');
            expect(errors.length).toBe(TEST_ERROR_COUNT);
        });

        it('should handle null nameValidation gracefully', () => {
            const validPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(validPlayer);
            spyOn(
                service as unknown as {
                    validationProblems: () => {
                        nameValidation: null;
                        avatarSelection: { isValid: boolean; errors: string[] };
                        bonusSelection: { isValid: boolean; errors: string[] };
                    };
                },
                'validationProblems',
            ).and.returnValue({
                nameValidation: null,
                avatarSelection: { isValid: true, errors: [] },
                bonusSelection: { isValid: true, errors: [] },
            });

            const errors = service.getErrorMessages();
            expect(errors).toEqual([]);
        });

        it('should handle null bonusSelection gracefully', () => {
            const validPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(validPlayer);
            spyOn(
                service as unknown as {
                    validationProblems: () => {
                        nameValidation: { isValid: boolean; errors: string[] };
                        avatarSelection: { isValid: boolean; errors: string[] };
                        bonusSelection: null;
                    };
                },
                'validationProblems',
            ).and.returnValue({
                nameValidation: { isValid: true, errors: [] },
                avatarSelection: { isValid: true, errors: [] },
                bonusSelection: null,
            });

            const errors = service.getErrorMessages();
            expect(errors).toEqual([]);
        });

        it('should handle null avatarSelection gracefully', () => {
            const validPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(validPlayer);
            spyOn(
                service as unknown as {
                    validationProblems: () => {
                        nameValidation: { isValid: boolean; errors: string[] };
                        avatarSelection: null;
                        bonusSelection: { isValid: boolean; errors: string[] };
                    };
                },
                'validationProblems',
            ).and.returnValue({
                nameValidation: { isValid: true, errors: [] },
                avatarSelection: null,
                bonusSelection: { isValid: true, errors: [] },
            });

            const errors = service.getErrorMessages();
            expect(errors).toEqual([]);
        });
    });

    describe('bonus validation', () => {
        it('should pass when health bonus is selected', () => {
            const validPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
                speedBonus: 0,
            };
            mockPlayerService.player.and.returnValue(validPlayer);

            expect(service.canCreate()).toBe(true);
        });

        it('should pass when speed bonus is selected', () => {
            const validPlayer = {
                ...basePlayer,
                name: 'ValidName',
                avatar: Avatar.Avatar1,
                healthBonus: 0,
                speedBonus: 2,
            };
            mockPlayerService.player.and.returnValue(validPlayer);

            expect(service.canCreate()).toBe(true);
        });
    });

    describe('name trimming', () => {
        it('should trim whitespace from name before validation', () => {
            const validPlayer = {
                ...basePlayer,
                name: '  ValidName  ',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(validPlayer);

            expect(service.canCreate()).toBe(true);
        });

        it('should fail validation when trimmed name is too short', () => {
            const invalidPlayer = {
                ...basePlayer,
                name: '  ab  ',
                avatar: Avatar.Avatar1,
                healthBonus: 2,
            };
            mockPlayerService.player.and.returnValue(invalidPlayer);

            expect(service.canCreate()).toBe(false);
        });
    });
});
