import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HP_HIGH_THRESHOLD_PERCENT, HP_MEDIUM_THRESHOLD_PERCENT, PERCENTAGE_MULTIPLIER } from '@app/constants/player.constants';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';

@Component({
    selector: 'app-player-info',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './player-info.component.html',
    styleUrls: ['./player-info.component.scss'],
})
export class PlayerInfoComponent {
    constructor(
        private readonly playerService: PlayerService,
        private readonly assetsService: AssetsService,
        readonly inGameService: InGameService,
    ) {}

    get player() {
        return this.playerService.player();
    }

    get avatarImage(): string {
        const avatar = this.player.avatar || Avatar.Avatar1;
        return this.assetsService.getAvatarStaticImage(avatar);
    }

    get playerName(): string {
        return this.playerService.name();
    }

    get currentHealth(): number {
        return this.playerService.health();
    }

    get maxHealth(): number {
        return this.playerService.maxHealth();
    }

    get rapidityValue(): number {
        return this.playerService.speed();
    }

    get baseAttack(): number {
        return this.player.baseAttack;
    }

    get attackDiceType(): string {
        return this.playerService.attackDice();
    }

    get baseDefense(): number {
        return this.player.baseDefense;
    }

    get defenseDiceType(): string {
        return this.playerService.defenseDice();
    }

    get attackBonus(): number {
        return this.playerService.attackBonus();
    }

    get defenseBonus(): number {
        return this.playerService.defenseBonus();
    }

    get baseSpeed(): number {
        return this.player.baseSpeed;
    }

    get speedBonus(): number {
        return this.player.speedBonus;
    }

    get boatSpeedBonus(): number {
        return this.player.boatSpeedBonus;
    }

    get baseHealth(): number {
        return this.player.baseHealth;
    }

    get healthBonus(): number {
        return this.player.healthBonus;
    }

    get remainingBaseMovementPoints(): number {
        const totalSpeed = this.playerService.speed();
        const bonusSpeed = this.playerService.speedBonus();
        return Math.max(0, totalSpeed - bonusSpeed);
    }

    get remainingBonusMovementPoints(): number {
        const totalSpeed = this.playerService.speed();
        const bonusSpeed = this.playerService.speedBonus();
        return Math.min(bonusSpeed, totalSpeed);
    }

    get actionsRemaining(): number {
        return this.playerService.actionsRemaining();
    }

    get hpPercentage(): number {
        return this.maxHealth > 0 ? (this.currentHealth / this.maxHealth) * PERCENTAGE_MULTIPLIER : 0;
    }

    get hpColorClass(): string {
        const percentage = this.hpPercentage;
        if (percentage > HP_HIGH_THRESHOLD_PERCENT) return 'hp-high';
        if (percentage > HP_MEDIUM_THRESHOLD_PERCENT) return 'hp-medium';
        return 'hp-critical';
    }

    get totalCombats(): number {
        return this.playerService.combatCount();
    }

    get combatWins(): number {
        return this.playerService.combatWins();
    }

    get combatLosses(): number {
        return this.playerService.combatLosses();
    }

    get combatDraws(): number {
        return this.playerService.combatDraws();
    }

    get teamNumber(): number | undefined {
        return this.player.teamNumber;
    }

    getTeamColor(teamNumber: number | undefined): string | undefined {
        return this.playerService.getTeamColor(teamNumber);
    }

    get hasFlag(): boolean {
        const flagData = this.inGameService.flagData();
        return flagData?.holderPlayerId === this.playerService.id();
    }

    isActionDisabled(): boolean {
        return (
            !this.inGameService.isMyTurn() || !this.inGameService.isGameStarted() || this.inGameService.hasUsedAction() || !this.hasAvailableActions()
        );
    }

    hasAvailableActions(): boolean {
        return this.inGameService.availableActions().length > 0;
    }

    onAction(): void {
        this.inGameService.activateActionMode();
    }
}
