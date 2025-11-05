import { computed, Injectable } from '@angular/core';
import { CHARACTER_NAME_MAX_LENGTH, NAME_MIN_LENGTH, WHITESPACE_PATTERN } from '@app/constants/validation.constants';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';
import { ValidationResult } from '@common/interfaces/validation-result.interface';

@Injectable()
export class CharacterCreationCheckService {
    constructor(private readonly playerService: PlayerService) {}

    private readonly validationProblems = computed(() => {
        const player = this.playerService.player();
        const name = player.name.trim() || '';
        const selectedAvatar = player.avatar;

        return {
            nameValidation: this.checkNameValidation(name),
            avatarSelection: this.checkAvatarSelection(selectedAvatar),
            bonusSelection: this.checkBonusSelection(player.healthBonus > 0 || player.speedBonus > 0),
        };
    });

    canCreate(): boolean {
        return Object.values(this.validationProblems()).every((problem) => problem.isValid);
    }

    getErrorMessages(): string[] {
        const problems = this.validationProblems();
        return [
            ...((problems.nameValidation && problems.nameValidation.errors) || []),
            ...((problems.avatarSelection && problems.avatarSelection.errors) || []),
            ...((problems.bonusSelection && problems.bonusSelection.errors) || []),
        ];
    }

    private checkNameValidation(name: string): ValidationResult {
        if (name.length < NAME_MIN_LENGTH || name.length > CHARACTER_NAME_MAX_LENGTH || name.replace(WHITESPACE_PATTERN, '').length === 0) {
            return {
                isValid: false,
                errors: [
                    `Le nom doit contenir entre ${NAME_MIN_LENGTH} et ${CHARACTER_NAME_MAX_LENGTH} caractères ` +
                        `et ne pas être composé uniquement d'espaces.`,
                ],
            };
        }

        return { isValid: true, errors: [] };
    }

    private checkAvatarSelection(avatar: Avatar | null): ValidationResult {
        if (avatar === null) {
            return { isValid: false, errors: ['Un avatar doit être sélectionné.'] };
        }

        return { isValid: true, errors: [] };
    }

    private checkBonusSelection(bonusSelected: boolean): ValidationResult {
        if (!bonusSelected) {
            return { isValid: false, errors: ['Un bonus doit être sélectionné.'] };
        }

        return { isValid: true, errors: [] };
    }
}
