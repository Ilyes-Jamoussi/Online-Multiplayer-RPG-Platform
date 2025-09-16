import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@app/services/notification/notification.service';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { UiCardComponent } from '@app/shared/ui/components/card/card.component';
import { UiCheckboxComponent } from '@app/shared/ui/components/checkbox/checkbox.component';
import { UiInputComponent } from '@app/shared/ui/components/input/input.component';

interface CharacterAttributes {
    vie: number;
    rapidite: number;
    attaque: number;
    defense: number;
}

interface DiceAssignment {
    attaque: 'D4' | 'D6';
    defense: 'D4' | 'D6';
}

interface Character {
    name: string;
    avatar: number;
    attributes: CharacterAttributes;
    bonus: 'vie' | 'rapidite' | null;
    diceAssignment: DiceAssignment;
}

@Component({
    selector: 'app-character-creation-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        UiCardComponent,
        UiButtonComponent,
        UiInputComponent,
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
            vie: 10,
            rapidite: 10,
            attaque: 10,
            defense: 10,
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
            vie: 10,
            rapidite: 10,
            attaque: 10,
            defense: 10,
        };

        // Apply bonus
        if (this.character.bonus) {
            this.character.attributes[this.character.bonus] += 2;
        }

        // Apply dice modifiers
        if (this.character.diceAssignment.attaque === 'D6') {
            this.character.attributes.attaque += 2;
        }
        if (this.character.diceAssignment.defense === 'D6') {
            this.character.attributes.defense += 2;
        }
    }

    generateRandomCharacter(): void {
        const PROBABILITY_THRESHOLD = 0.5;
        this.character.name = this.generateRandomName();
        this.character.avatar = Math.floor(Math.random() * this.avatars.length);
        
        const randomBonus = Math.random() > PROBABILITY_THRESHOLD ? 'vie' : 'rapidite';
        this.character.bonus = randomBonus;
        this.bonusVie = randomBonus === 'vie';
        this.bonusRapidite = randomBonus === 'rapidite';
        
        this.character.diceAssignment = {
            attaque: Math.random() > PROBABILITY_THRESHOLD ? 'D4' : 'D6',
            defense: Math.random() > PROBABILITY_THRESHOLD ? 'D4' : 'D6',
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
