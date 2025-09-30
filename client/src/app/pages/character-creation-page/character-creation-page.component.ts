import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ErrorsBadgeComponent } from '@app/components/features/errors-badge/errors-badge.component';
import { StatsBarComponent } from '@app/components/features/stats-bar/stats-bar.component';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/constants/routes.constants';
import { CHARACTER_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@app/constants/validation.constants';
import { AssetsService } from '@app/services/assets/assets.service';
import { CharacterCreationCheckService } from '@app/services/character-creation-check/character-creation-check.service';
import { CharacterStoreService } from '@app/services/character-store/character-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { BonusType, DiceType } from '@common/enums/character-creation.enum';

@Component({
    standalone: true,
    selector: 'app-character-creation-page',
    templateUrl: './character-creation-page.component.html',
    styleUrls: ['./character-creation-page.component.scss'],
    imports: [CommonModule, FormsModule, UiButtonComponent, UiInputComponent, UiPageLayoutComponent, StatsBarComponent, ErrorsBadgeComponent],
    providers: [CharacterCreationCheckService, CharacterStoreService],
})
export class CharacterCreationPageComponent {
    readonly diceType = DiceType;
    readonly bonusType = BonusType;
    readonly characterNameMinLength = NAME_MIN_LENGTH;
    readonly characterNameMaxLength = CHARACTER_NAME_MAX_LENGTH;
    readonly avatars = this.characterStoreService.avatars;

    constructor(
        readonly assetsService: AssetsService,
        readonly characterCreationCheckService: CharacterCreationCheckService,
        private readonly characterStoreService: CharacterStoreService,
        private readonly notificationService: NotificationService,
    ) {}

    get hasSelectedAvatar(): boolean {
        return this.character.avatar !== null;
    }

    get showAvatarPlaceholder(): boolean {
        return !this.hasSelectedAvatar;
    }

    get isLifeBonusSelected(): boolean {
        return this.character.bonus === BonusType.Life;
    }

    get isSpeedBonusSelected(): boolean {
        return this.character.bonus === BonusType.Speed;
    }

    get isAttackD4Selected(): boolean {
        return this.character.diceAssignment.attack === DiceType.D4;
    }

    get isAttackD6Selected(): boolean {
        return this.character.diceAssignment.attack === DiceType.D6;
    }

    get isDefenseD4Selected(): boolean {
        return this.character.diceAssignment.defense === DiceType.D4;
    }

    get isDefenseD6Selected(): boolean {
        return this.character.diceAssignment.defense === DiceType.D6;
    }

    getisAvatarSelected(avatar: number): boolean {
        return this.character.avatar === avatar;
    }

    get selectedAvatarAltText(): string {
        return this.character.avatar !== null ? `Avatar sélectionné ${this.character.avatar + 1}` : '';
    }

    get character() {
        return this.characterStoreService.character();
    }

    get store() {
        return this.characterStoreService;
    }

    get selectedAvatarImage(): string {
        if (this.character.avatar === null) return '';
        return this.assetsService.getAvatarAnimatedByNumber(this.character.avatar + 1);
    }

    getAvatarImage(avatarIndex: number): string {
        return this.assetsService.getAvatarStaticByNumber(avatarIndex + 1);
    }

    onNameChange(v: string) {
        this.characterStoreService.name = v;
    }

    selectAvatar(index: number) {
        this.characterStoreService.avatar = index;
    }

    onBonusChange(bonus: BonusType) {
        this.characterStoreService.bonus = bonus;
    }

    onAttackDiceChange(value: DiceType) {
        this.characterStoreService.setDice('attack', value);
    }
    onDefenseDiceChange(value: DiceType) {
        this.characterStoreService.setDice('defense', value);
    }

    generateRandomCharacter() {
        this.characterStoreService.generateRandom();
    }

    onSubmit() {
        if (!this.characterCreationCheckService.canCreate()) {
            this.notificationService.displayError({
                title: 'Erreur de validation',
                message: 'Nom, avatar et bonus requis.',
            });
            return;
        }

        this.notificationService.displaySuccess({
            title: 'Personnage créé',
            message: `${this.character.name} est prêt pour l’aventure.`,
            redirectRoute: ROUTES.waitingRoom,
        });
    }
}
