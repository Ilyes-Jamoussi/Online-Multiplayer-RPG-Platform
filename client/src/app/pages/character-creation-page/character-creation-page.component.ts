import { Location } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarGridComponent } from '@app/components/features/avatar-grid/avatar-grid.component';
import { ErrorsBadgeComponent } from '@app/components/features/errors-badge/errors-badge.component';
import { StatsBarComponent } from '@app/components/features/stats-bar/stats-bar.component';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { CHARACTER_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@app/constants/validation.constants';
import { AssetsService } from '@app/services/assets/assets.service';
import { CharacterCreationCheckService } from '@app/services/character-creation-check/character-creation-check.service';
import { CharacterEditorService } from '@app/services/character-editor/character-editor.service';
import { PlayerService } from '@app/services/player/player.service';
import { BonusType } from '@common/enums/character-creation.enum';
import { Dice } from '@common/enums/dice.enum';

@Component({
    standalone: true,
    selector: 'app-character-creation-page',
    templateUrl: './character-creation-page.component.html',
    styleUrls: ['./character-creation-page.component.scss'],
    imports: [FormsModule, UiButtonComponent, UiInputComponent, UiPageLayoutComponent, StatsBarComponent, ErrorsBadgeComponent, AvatarGridComponent],
    providers: [CharacterCreationCheckService, CharacterEditorService],
})
export class CharacterCreationPageComponent implements OnInit {
    readonly dice = Dice;
    readonly bonusType = BonusType;
    readonly characterNameMinLength = NAME_MIN_LENGTH;
    readonly characterNameMaxLength = CHARACTER_NAME_MAX_LENGTH;

    constructor(
        private readonly assetsService: AssetsService,
        private readonly characterCreationCheckService: CharacterCreationCheckService,
        private readonly characterEditorService: CharacterEditorService,
        private readonly playerService: PlayerService,
        private readonly location: Location,
    ) {
        // Synchroniser l'avatar PlayerService -> CharacterEditorService
        effect(() => {
            const playerAvatar = this.playerService.avatar();
            if (playerAvatar) {
                this.characterEditorService.avatar = playerAvatar;
            }
        });
    }

    ngOnInit(): void {
        const currentAvatar = this.playerService.avatar();
        if (currentAvatar) {
            this.characterEditorService.avatar = currentAvatar;
        }
    }

    get isLifeBonusSelected(): boolean {
        return this.character.bonus === BonusType.Life || false;
    }

    get isSpeedBonusSelected(): boolean {
        return this.character.bonus === BonusType.Speed || false;
    }

    get isAttackD4Selected(): boolean {
        return this.character.diceAssignment.attack === Dice.D4 || false;
    }

    get isAttackD6Selected(): boolean {
        return this.character.diceAssignment.attack === Dice.D6 || false;
    }

    get isDefenseD4Selected(): boolean {
        return this.character.diceAssignment.defense === Dice.D4 || false;
    }

    get isDefenseD6Selected(): boolean {
        return this.character.diceAssignment.defense === Dice.D6 || false;
    }

    get character() {
        return this.characterEditorService.character();
    }

    get canCreateCharacter(): boolean {
        return this.characterCreationCheckService.canCreate();
    }

    get isPlayerAdmin(): boolean {
        return this.playerService.isAdmin();
    }

    getDiceImage(dice: Dice): string {
        return this.assetsService.getDiceImage(dice);
    }

    onNameChange(name: string): void {
        this.characterEditorService.name = name;
    }

    onBonusChange(bonus: BonusType): void {
        this.characterEditorService.bonus = bonus;
    }

    onAttackDiceChange(value: Dice): void {
        this.characterEditorService.setDice('attack', value);
    }

    onDefenseDiceChange(value: Dice): void {
        this.characterEditorService.setDice('defense', value);
    }

    generateRandomCharacter(): void {
        this.characterEditorService.generateRandom();
        const avatar = this.characterEditorService.character().avatar;
        if (avatar) {
            this.playerService.selectAvatar(avatar);
        }
    }

    onSubmit(): void {
        const character = this.character;
        if (!character) return;

        this.playerService.characterData = character;

        if (this.isPlayerAdmin) this.playerService.createSession();
        else this.playerService.joinSession();
    }

    onBack(): void {
        this.playerService.leaveAvatarSelection();
        this.location.back();
    }
}
