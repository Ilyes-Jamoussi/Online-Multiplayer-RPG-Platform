import { computed, Injectable } from '@angular/core';
import { NAME_MIN_LENGTH, CHARACTER_NAME_MAX_LENGTH, WHITESPACE_PATTERN } from '@app/constants/validation.constants';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';

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

        if (problems.bonusSelection.hasIssue && problems.bonusSelection.message) {
            messages.push(problems.bonusSelection.message);
        }

        return messages;
    }

    private checkNameValidation(name: string): { hasIssue: boolean; message?: string } {
        if (name.length < NAME_MIN_LENGTH || name.length > CHARACTER_NAME_MAX_LENGTH || name.replace(WHITESPACE_PATTERN, '').length === 0) {
            return {
                hasIssue: true,
                message:
                    `Le nom doit contenir entre ${NAME_MIN_LENGTH} et ${CHARACTER_NAME_MAX_LENGTH} caractères ` +
                    `et ne pas être composé uniquement d'espaces.`,
            };
        }

        return { hasIssue: false };
    }

    private checkAvatarSelection(avatar: Avatar | null): { hasIssue: boolean; message?: string } {
        if (avatar === null) {
            return {
                hasIssue: true,
                message: 'Un avatar doit être sélectionné.',
            };
        }

        return { hasIssue: false };
    }

    private checkBonusSelection(hasBonus: boolean): { hasIssue: boolean; message?: string } {
        if (!hasBonus) {
            return {
                hasIssue: true,
                message: 'Un bonus doit être sélectionné.',
            };
        }

        return { hasIssue: false };
    }
}
