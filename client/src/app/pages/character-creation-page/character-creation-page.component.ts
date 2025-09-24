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
    imports: [
        CommonModule,
        FormsModule,
        UiButtonComponent,
        UiInputComponent,
        UiPageLayoutComponent,
        StatsBarComponent,
    ],
})
export class CharacterCreationPageComponent implements OnInit {
    // Expose l'état lisible pour le template
    get character() {
        return this.store.character();
    }

    // Liste d'avatars (ex: [0..11])
    avatars = this.store.avatars;

    constructor(
        readonly store: CharacterStoreService,
        private readonly router: Router,
        private readonly notif: NotificationService,
        readonly assets: AssetsService,
    ) {}

    getAvatarImage(avatarIndex: number): string {
        return this.assets.getAvatarStaticByNumber(avatarIndex + 1);
    }

    getSelectedAvatarImage(): string {
        if (this.character.avatar === null) return '';
        return this.assets.getAvatarAnimatedByNumber(this.character.avatar + 1);
    }

    ngOnInit() {
        // Reset l'avatar pour qu'aucun ne soit sélectionné par défaut
        this.store.resetAvatar();
        // Définir 'life' comme bonus par défaut dès l'entrée sur la page
        this.store.setBonus('life');
    }

    // Navigation
    goBack() {
        this.router.navigate([ROUTES.gameSessionCreation]);
    }

    // Nom
    onNameChange(v: string) {
        this.store.setName(v);
    }

    // Avatar
    selectAvatar(index: number) {
        this.store.selectAvatar(index);
    }

    // Bonus exclusif (Life/Speed) via radios
    onBonusChange(bonus: 'life' | 'speed') {
        this.store.setBonus(bonus);
    }

    // Dés (radios)
    onAttackDiceChange(value: 'D4' | 'D6') {
        this.store.setDice('attack', value);
    }
    onDefenseDiceChange(value: 'D4' | 'D6') {
        this.store.setDice('defense', value);
    }

    // Aléatoire
    generateRandomCharacter() {
        this.store.generateRandom();
    }

    // Soumission
    onSubmit() {
        if (!this.store.isValid()) {
            this.notif.displayError({
                title: 'Erreur de validation',
                message: 'Nom requis et bonus à sélectionner.',
            });
            return;
        }

        this.notif.displaySuccess({
            title: 'Personnage créé',
            message: `${this.character.name} est prêt pour l’aventure.`,
        });

        this.router.navigate([ROUTES.waitingRoom]);
    }

    onBackClick() {
        this.router.navigate(['/']);
    }
}