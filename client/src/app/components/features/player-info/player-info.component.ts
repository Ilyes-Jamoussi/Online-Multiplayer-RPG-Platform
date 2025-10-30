import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
        return this.playerService.health();
    }
    
    get maxHP(): number { 
        return this.playerService.maxHealth();
    }
    
    get currentSpeed(): number {
        return this.playerService.speed();
    }
    
    get maxSpeed(): number {
        return this.playerService.speed();
    }
    
    get attackValue(): number { 
        return this.playerService.attack(); 
    }
    
    get defenseValue(): number { 
        return this.playerService.defense(); 
    }

    get remainingSpeed(): number {
        return this.playerService.speed();
    }
    
    get baseSpeed(): number { return this.playerService.baseSpeed(); }
    get speedBonus(): number { return this.playerService.speedBonus(); }
    get actionsRemaining(): number { return this.playerService.actionsRemaining(); }

    get attackDice(): string {
        return this.playerService.attackDice();
    }

    get defenseDice(): string {
        return this.playerService.defenseDice();
    }

    get characterName(): string {
        return this.playerService.name();
    }
}
