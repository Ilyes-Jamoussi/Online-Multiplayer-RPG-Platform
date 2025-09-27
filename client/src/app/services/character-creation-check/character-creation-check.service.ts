import { computed, Injectable } from '@angular/core';
import { CHARACTER_NAME_MIN_LENGTH, CHARACTER_NAME_MAX_LENGTH, WHITESPACE_PATTERN } from '@app/constants/validation.constants';
import { CharacterStoreService } from '@app/services/game/character-store/character-store.service';

@Injectable()
export class CharacterCreationCheckService {
    constructor(private readonly characterStoreService: CharacterStoreService) {}

    readonly validationProblems = computed(() => {
        const character = this.characterStoreService.character();
        const name = character.name.trim();

        return {
            nameValidation: this.checkNameValidation(name),
            avatarSelection: this.checkAvatarSelection(character.avatar),
        };
    });

    canCreate(): boolean {
        return !Object.values(this.validationProblems()).some((problem) => problem.hasIssue);
    }

    getErrorMessages(): string[] {
        const problems = this.validationProblems();
        const messages: string[] = [];

        if (problems.nameValidation.hasIssue && problems.nameValidation.message) {
            messages.push(problems.nameValidation.message);
        }

        if (problems.avatarSelection.hasIssue && problems.avatarSelection.message) {
            messages.push(problems.avatarSelection.message);
        }

        return messages;
    }

    private checkNameValidation(name: string): { hasIssue: boolean; message?: string } {
        if (name.length < CHARACTER_NAME_MIN_LENGTH || name.length > CHARACTER_NAME_MAX_LENGTH || name.replace(WHITESPACE_PATTERN, '').length === 0) {
            return {
                hasIssue: true,
                message:
                    `Le nom doit contenir entre ${CHARACTER_NAME_MIN_LENGTH} et ${CHARACTER_NAME_MAX_LENGTH} caractères ` +
                    `et ne pas être composé uniquement d'espaces.`,
            };
        }

        return { hasIssue: false };
    }

    private checkAvatarSelection(avatar: number | null): { hasIssue: boolean; message?: string } {
        if (avatar === null) {
            return {
                hasIssue: true,
                message: 'Un avatar doit être sélectionné.',
            };
        }

        return { hasIssue: false };
    }
}
