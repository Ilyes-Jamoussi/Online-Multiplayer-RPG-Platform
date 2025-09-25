import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ROUTES } from '@app/constants/routes.constants';
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
    // Expose l'état lisible pour le template
    get character() {
        return this.characterStoreService.character();
    }

    get store() {
        return this.characterStoreService;
    }

    // Liste d'avatars (ex: [0..11])
    avatars = this.characterStoreService.avatars;

    constructor(
        private readonly characterStoreService: CharacterStoreService,
        private readonly router: Router,
        private readonly notificationService: NotificationService,
        readonly assetsService: AssetsService,
    ) {}

    getAvatarImage(avatarIndex: number): string {
        return this.assetsService.getAvatarStaticByNumber(avatarIndex + 1);
    }

    getSelectedAvatarImage(): string {
        if (this.character.avatar === null) return '';
        return this.assetsService.getAvatarAnimatedByNumber(this.character.avatar + 1);
    }

    ngOnInit() {
        // Reset l'avatar pour qu'aucun ne soit sélectionné par défaut
        this.characterStoreService.resetAvatar();
        // Définir 'life' comme bonus par défaut dès l'entrée sur la page
        this.characterStoreService.setBonus('life');
    }

    // Navigation
    goBack() {
        this.router.navigate([ROUTES.gameSessionCreation]);
    }

    // Nom
    onNameChange(v: string) {
        this.characterStoreService.setName(v);
    }

    // Avatar
    selectAvatar(index: number) {
        this.characterStoreService.selectAvatar(index);
    }

    // Bonus exclusif (Life/Speed) via radios
    onBonusChange(bonus: 'life' | 'speed') {
        this.characterStoreService.setBonus(bonus);
    }

    // Dés (radios)
    onAttackDiceChange(value: 'D4' | 'D6') {
        this.characterStoreService.setDice('attack', value);
    }
    onDefenseDiceChange(value: 'D4' | 'D6') {
        this.characterStoreService.setDice('defense', value);
    }

    // Aléatoire
    generateRandomCharacter() {
        this.characterStoreService.generateRandom();
    }

    // Soumission
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
