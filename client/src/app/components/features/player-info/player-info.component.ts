import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DEFAULT_ACTIONS, DEFAULT_BONUS_MOVEMENT, DEFAULT_MOVEMENT_POINTS, MAX_STAT_VALUE } from '@app/constants/player-info.constants';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
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

    get currentHP(): number { 
        return this.playerService.lifePoints;
    }
    
    get maxHP(): number { 
        return MAX_STAT_VALUE;
    }
    
    get currentSpeed(): number {
        return this.playerService.speedPoints;
    }
    
    get maxSpeed(): number {
        return MAX_STAT_VALUE;
    }
    
    get attackValue(): number { 
        return this.playerService.attackPoints; 
    }
    
    get defenseValue(): number { 
        return this.playerService.defensePoints; 
    }

    get remainingMovementPoints(): number {
        return this.playerService.remainingMovementPoints;
    }
    
    get movementPoints(): number { return DEFAULT_MOVEMENT_POINTS; }
    get bonusMovementPoints(): number { return DEFAULT_BONUS_MOVEMENT; }
    get actionsRemaining(): number { return DEFAULT_ACTIONS; }

    get attackDice(): string {
        return this.playerService.attackDice;
    }

    get defenseDice(): string {
        return this.playerService.defenseDice;
    }

    get characterName(): string {
        return this.playerService.characterName;
    }
}
