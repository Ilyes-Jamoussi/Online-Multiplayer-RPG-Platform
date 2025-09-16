import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_CONSTANTS } from '@app/constants/ui.constants';
import { Character } from '@app/interfaces/character.interface';
import { NotificationService } from '@app/services/notification/notification.service';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { UiCheckboxComponent } from '@app/shared/ui/components/checkbox/checkbox.component';

@Component({
    selector: 'app-character-creation-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        UiButtonComponent,
        UiCheckboxComponent,
    ],
    templateUrl: './character-creation-page.component.html',
    styleUrls: ['./character-creation-page.component.scss'],
})
export class CharacterCreationPageComponent implements OnInit {
    character: Character = {
        name: '',
        avatar: 0,
        attributes: {
            vie: UI_CONSTANTS.characterCreation.baseAttributeValue,
            rapidite: UI_CONSTANTS.characterCreation.baseAttributeValue,
            attaque: UI_CONSTANTS.characterCreation.baseAttributeValue,
            defense: UI_CONSTANTS.characterCreation.baseAttributeValue,
        },
        bonus: null,
        diceAssignment: {
            attaque: 'D4',
            defense: 'D6',
        },
    };

    avatars: number[] = Array.from({ length: 8 }, (_, i) => i);
    gameId: string | null = null;

    // Checkbox helpers
    bonusVie = false;
    bonusRapidite = false;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.gameId = params.gameId || null;
        });
        this.generateRandomCharacter();
    }

    selectAvatar(index: number): void {
        this.character.avatar = index;
    }

    onBonusChange(type: 'vie' | 'rapidite'): void {
        if (type === 'vie') {
            this.character.bonus = this.bonusVie ? 'vie' : null;
            this.bonusRapidite = false;
        } else {
            this.character.bonus = this.bonusRapidite ? 'rapidite' : null;
            this.bonusVie = false;
        }
        this.updateAttributes();
    }

    onDiceChange(attribute: 'attaque' | 'defense', diceType: 'D4' | 'D6'): void {
        this.character.diceAssignment[attribute] = diceType;
        this.updateAttributes();
    }

    private updateAttributes(): void {
        // Reset to base values
        this.character.attributes = {
            vie: UI_CONSTANTS.characterCreation.baseAttributeValue,
            rapidite: UI_CONSTANTS.characterCreation.baseAttributeValue,
            attaque: UI_CONSTANTS.characterCreation.baseAttributeValue,
            defense: UI_CONSTANTS.characterCreation.baseAttributeValue,
        };

        // Apply bonus
        if (this.character.bonus) {
            this.character.attributes[this.character.bonus] += UI_CONSTANTS.characterCreation.bonusAttributeValue;
        }

        // Apply dice modifiers
        if (this.character.diceAssignment.attaque === 'D6') {
            this.character.attributes.attaque += UI_CONSTANTS.characterCreation.bonusAttributeValue;
        }
        if (this.character.diceAssignment.defense === 'D6') {
            this.character.attributes.defense += UI_CONSTANTS.characterCreation.bonusAttributeValue;
        }
    }

    generateRandomCharacter(): void {
        this.character.name = this.generateRandomName();
        this.character.avatar = Math.floor(Math.random() * this.avatars.length);
        
        const randomBonus = Math.random() > UI_CONSTANTS.characterCreation.probabilityThreshold ? 'vie' : 'rapidite';
        this.character.bonus = randomBonus;
        this.bonusVie = randomBonus === 'vie';
        this.bonusRapidite = randomBonus === 'rapidite';
        
        this.character.diceAssignment = {
            attaque: Math.random() > UI_CONSTANTS.characterCreation.probabilityThreshold ? 'D4' : 'D6',
            defense: Math.random() > UI_CONSTANTS.characterCreation.probabilityThreshold ? 'D4' : 'D6',
        };
        this.updateAttributes();
    }

    private generateRandomName(): string {
        const names = [
            'Aragorn',
            'Legolas',
            'Gimli',
            'Gandalf',
            'Frodo',
            'Samwise',
            'Boromir',
            'Faramir',
            'Éowyn',
            'Arwen',
            'Galadriel',
            'Elrond',
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    isFormValid(): boolean {
        return (
            this.character.name.trim().length > 0 &&
            this.character.bonus !== null &&
            this.character.diceAssignment.attaque !== null &&
            this.character.diceAssignment.defense !== null
        );
    }

    onSubmit(): void {
        if (!this.isFormValid()) {
            this.notificationService.displayError({
                title: 'Erreur de validation',
                message: 'Veuillez remplir tous les champs requis et sélectionner un bonus'
            });
            return;
        }

        this.notificationService.displaySuccess({
            title: 'Personnage créé !',
            message: `${this.character.name} est prêt pour l'aventure`
        });

        // TODO: Envoyer les données au serveur
        // TODO: Rediriger vers la page de jeu
    }

    goBack(): void {
        this.router.navigate(['/create-game-page']);
    }

    goToHome(): void {
        this.router.navigate(['/home']);
    }
}
