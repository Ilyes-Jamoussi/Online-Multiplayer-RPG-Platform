import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ROUTES } from '@app/constants/routes.constants';
import { CHARACTER_NAME_MIN_LENGTH, CHARACTER_NAME_MAX_LENGTH, WHITESPACE_PATTERN } from '@app/constants/validation.constants';
import { CharacterStoreService } from '@app/services/game/character-store/character-store.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { UiInputComponent } from '@app/shared/ui/components/input/input.component';
import { UiPageLayoutComponent } from '@app/shared/ui/components/page-layout/page-layout.component';
import { StatsBarComponent } from '@app/shared/components/stats-bar/stats-bar.component';

@Component({
    standalone: true,
    selector: 'app-character-creation-page',
    templateUrl: './character-creation-page.component.html',
    styleUrls: ['./character-creation-page.component.scss'],
    imports: [CommonModule, FormsModule, UiButtonComponent, UiInputComponent, UiPageLayoutComponent, StatsBarComponent],
})
export class CharacterCreationPageComponent implements OnInit {
    readonly CHARACTER_NAME_MIN_LENGTH = CHARACTER_NAME_MIN_LENGTH;
    readonly CHARACTER_NAME_MAX_LENGTH = CHARACTER_NAME_MAX_LENGTH;

    get character() {
        return this.characterStoreService.character();
    }

    get store() {
        return this.characterStoreService;
    }

    avatars = this.characterStoreService.avatars;

    constructor(
        readonly assetsService: AssetsService,
        private readonly characterStoreService: CharacterStoreService,
        private readonly router: Router,
        private readonly notificationService: NotificationService,
    ) {}

    getAvatarImage(avatarIndex: number): string {
        return this.assetsService.getAvatarStaticByNumber(avatarIndex + 1);
    }

    getSelectedAvatarImage(): string {
        if (this.character.avatar === null) return '';
        return this.assetsService.getAvatarAnimatedByNumber(this.character.avatar + 1);
    }

    ngOnInit() {
        this.characterStoreService.resetAvatar();
        this.characterStoreService.setBonus('life');
    }

    goBack() {
        this.router.navigate([ROUTES.gameSessionCreation]);
    }

    onNameChange(v: string) {
        this.characterStoreService.setName(v);
    }

    getNameErrorMessage(): string {
        const name = this.character.name.trim();
        if (name.length === 0) return '';
        if (name.length < CHARACTER_NAME_MIN_LENGTH || name.length > CHARACTER_NAME_MAX_LENGTH) {
            return `Le nom doit contenir entre ${CHARACTER_NAME_MIN_LENGTH} et ${CHARACTER_NAME_MAX_LENGTH} caractères.`;
        }
        if (name.replace(WHITESPACE_PATTERN, '').length === 0) {
            return 'Le nom ne peut pas être composé uniquement d\'espaces.';
        }
        return '';
    }

    selectAvatar(index: number) {
        this.characterStoreService.selectAvatar(index);
    }

    onBonusChange(bonus: 'life' | 'speed') {
        this.characterStoreService.setBonus(bonus);
    }

    onAttackDiceChange(value: 'D4' | 'D6') {
        this.characterStoreService.setDice('attack', value);
    }
    onDefenseDiceChange(value: 'D4' | 'D6') {
        this.characterStoreService.setDice('defense', value);
    }

    generateRandomCharacter() {
        this.characterStoreService.generateRandom();
    }

    onSubmit() {
        if (!this.characterStoreService.isValid) {
            this.notificationService.displayError({
                title: 'Erreur de validation',
                message: 'Nom, avatar et bonus requis.',
            });
            return;
        }

        this.notificationService.displaySuccess({
            title: 'Personnage créé',
            message: `${this.character.name} est prêt pour l’aventure.`,
        });

        this.router.navigate([ROUTES.waitingRoom]);
    }

    onBackClick() {
        this.router.navigate(['/']);
    }
}
