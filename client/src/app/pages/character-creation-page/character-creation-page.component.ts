import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { PlayerService } from '@app/services/player/player.service';
import { BonusType } from '@common/enums/character-creation.enum';
import { Dice } from '@common/enums/dice.enum';
import { ROUTES } from '@common/enums/routes.enum';

@Component({
    standalone: true,
    selector: 'app-character-creation-page',
    templateUrl: './character-creation-page.component.html',
    styleUrls: ['./character-creation-page.component.scss'],
    imports: [FormsModule, UiButtonComponent, UiInputComponent, UiPageLayoutComponent, StatsBarComponent, ErrorsBadgeComponent, AvatarGridComponent],
    providers: [CharacterCreationCheckService],
})
export class CharacterCreationPageComponent implements OnInit {
    readonly dice = Dice;
    readonly bonusType = BonusType;
    readonly characterNameMinLength = NAME_MIN_LENGTH;
    readonly characterNameMaxLength = CHARACTER_NAME_MAX_LENGTH;

    constructor(
        private readonly assetsService: AssetsService,
        private readonly characterCreationCheckService: CharacterCreationCheckService,
        private readonly playerService: PlayerService,
        private readonly location: Location,
        private readonly notificationCoordinatorService: NotificationCoordinatorService,
    ) {}

    ngOnInit(): void {
        if (!this.playerService.isConnected()) {
            this.notificationCoordinatorService.displayErrorPopup({ 
                title: 'Session expirée',
                message: 'Veuillez rejoindre une session.',
                redirectRoute: ROUTES.HomePage,
            });
            return;
        }
    }

    get isLifeBonusSelected(): boolean {
        return this.playerService.isLifeBonusSelected();
    }

    get isSpeedBonusSelected(): boolean {
        return this.playerService.isSpeedBonusSelected();
    }

    get isAttackD4Selected(): boolean {
        return this.playerService.attackDice() === Dice.D4;
    }

    get isAttackD6Selected(): boolean {
        return this.playerService.attackDice() === Dice.D6;
    }

    get isDefenseD4Selected(): boolean {
        return this.playerService.defenseDice() === Dice.D4;
    }

    get isDefenseD6Selected(): boolean {
        return this.playerService.defenseDice() === Dice.D6;
    }

    get canCreateCharacter(): boolean {
        return this.characterCreationCheckService.canCreate();
    }

    get isPlayerAdmin(): boolean {
        return this.playerService.isAdmin();
    }

    get playerName(): string {
        return this.playerService.name();
    }

    get playerHealth(): number {
        return this.playerService.health();
    }

    get playerSpeed(): number {
        return this.playerService.speed();
    }

    getDiceImage(dice: Dice): string {
        return this.assetsService.getDiceImage(dice);
    }

    onNameChange(name: string): void {
        this.playerService.setName(name);
    }

    onBonusChange(bonus: BonusType): void {
        this.playerService.setBonus(bonus);
    }

    onAttackDiceChange(value: Dice): void {
        this.playerService.setDice('attack', value);
    }

    onDefenseDiceChange(value: Dice): void {
        this.playerService.setDice('defense', value);
    }

    generateRandomCharacter(): void {
        this.playerService.generateRandom();
    }

    onSubmit(): void {
        if (this.isPlayerAdmin) this.playerService.createSession();
        else this.playerService.joinSession();
    }

    onBack(): void {
        this.playerService.leaveAvatarSelection();
        this.location.back();
    }
}
