import { computed, Injectable } from '@angular/core';
import { NAME_MIN_LENGTH, CHARACTER_NAME_MAX_LENGTH, WHITESPACE_PATTERN } from '@app/constants/validation.constants';
import { CharacterEditorService } from '@app/services/character-editor/character-editor.service';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';
import { ValidationResult } from '@common/interfaces/validation-result.interface';

@Injectable()
export class CharacterCreationCheckService {
    constructor(
        private readonly characterEditorService: CharacterEditorService,
        private readonly playerService: PlayerService,
    ) {}

    private readonly validationProblems = computed(() => {
        const character = this.characterEditorService.character();
        const name = character.name.trim() || '';
        const selectedAvatar = this.playerService.avatar();

        return {
            nameValidation: this.checkNameValidation(name),
            avatarSelection: this.checkAvatarSelection(selectedAvatar),
            bonusSelection: this.checkBonusSelection(character.bonus || null),
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

    private checkBonusSelection(bonus: string | null): ValidationResult {
        if (!bonus) {
            return { isValid: false, errors: ['Un bonus doit être sélectionné.'] };
        }

        return { isValid: true, errors: [] };
    }
}
