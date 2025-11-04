import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { HP_HIGH_THRESHOLD_PERCENT, HP_MEDIUM_THRESHOLD_PERCENT, PERCENTAGE_MULTIPLIER } from '@app/constants/player.constants';
import { Avatar } from '@common/enums/avatar.enum';

@Component({
    selector: 'app-player-info',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './player-info.component.html',
    styleUrls: ['./player-info.component.scss']
})
export class PlayerInfoComponent {
    constructor(
        private readonly playerService: PlayerService,
        private readonly assetsService: AssetsService
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
    
    get attackValue(): number { 
        return this.playerService.attack(); 
    }
    
    get defenseValue(): number { 
        return this.playerService.defense(); 
    }

    get attackDiceType(): string {
        return this.playerService.attackDice();
    }

    get defenseDiceType(): string {
        return this.playerService.defenseDice();
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
}
