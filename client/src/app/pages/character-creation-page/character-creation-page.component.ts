import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
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
import { CharacterStoreService } from '@app/services/character-store/character-store.service';
import { PlayerService } from '@app/services/player/player.service';
import { BonusType } from '@common/enums/character-creation.enum';
import { Dice } from '@common/enums/dice.enum';

@Component({
    standalone: true,
    selector: 'app-character-creation-page',
    templateUrl: './character-creation-page.component.html',
    styleUrls: ['./character-creation-page.component.scss'],
    imports: [
        CommonModule, FormsModule, UiButtonComponent, UiInputComponent,
        UiPageLayoutComponent, StatsBarComponent, ErrorsBadgeComponent, AvatarGridComponent
    ],
    providers: [CharacterCreationCheckService, CharacterStoreService],
})
export class CharacterCreationPageComponent {
    readonly dice = Dice;
    readonly bonusType = BonusType;
    readonly characterNameMinLength = NAME_MIN_LENGTH;
    readonly characterNameMaxLength = CHARACTER_NAME_MAX_LENGTH;

    constructor(
        private readonly assetsService: AssetsService,
        private readonly characterCreationCheckService: CharacterCreationCheckService,
        private readonly characterStoreService: CharacterStoreService,
        private readonly playerService: PlayerService,
        private readonly location: Location,
    ) {}


    get isLifeBonusSelected(): boolean {
        return this.character.bonus === BonusType.Life;
    }

    get isSpeedBonusSelected(): boolean {
        return this.character.bonus === BonusType.Speed;
    }

    get isAttackD4Selected(): boolean {
        return this.character.diceAssignment.attack === Dice.D4;
    }

    get isAttackD6Selected(): boolean {
        return this.character.diceAssignment.attack === Dice.D6;
    }

    get isDefenseD4Selected(): boolean {
        return this.character.diceAssignment.defense === Dice.D4;
    }

    get isDefenseD6Selected(): boolean {
        return this.character.diceAssignment.defense === Dice.D6;
    }

    get character() {
        return this.characterStoreService.character();
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

    onNameChange(v: string): void {
        this.characterStoreService.name = v;
    }

    onBonusChange(bonus: BonusType): void {
        this.characterStoreService.bonus = bonus;
    }

    onAttackDiceChange(value: Dice): void {
        this.characterStoreService.setDice('attack', value);
    }

    onDefenseDiceChange(value: Dice): void {
        this.characterStoreService.setDice('defense', value);
    }

    generateRandomCharacter(): void {
        this.characterStoreService.generateRandom();
    }

    onSubmit(): void {
        this.playerService.updatePlayer({ name: this.character.name });

        if (this.isPlayerAdmin)
            this.playerService.createSession();
        else
            this.playerService.joinSession();
    }

    onBack(): void {
        this.playerService.leaveAvatarSelection();
        this.location.back();
    }
}

