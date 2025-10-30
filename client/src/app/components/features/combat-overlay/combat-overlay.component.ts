import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CombatTimerComponent } from '@app/components/features/combat-timer/combat-timer.component';
import { CombatService } from '@app/services/combat/combat.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { AssetsService } from '@app/services/assets/assets.service';

@Component({
    selector: 'app-combat-overlay',
    standalone: true,
    imports: [CommonModule, CombatTimerComponent],
    templateUrl: './combat-overlay.component.html',
    styleUrls: ['./combat-overlay.component.scss']
})
export class CombatOverlayComponent {
    constructor(
        private readonly combatService: CombatService,
        private readonly inGameService: InGameService,
        private readonly assetsService: AssetsService
    ) {}

    get combatData() {
        return this.combatService.combatData();
    }

    get attackerName() {
        return this.combatData ? this.inGameService.getPlayerByPlayerId(this.combatData.attackerId).name : '';
    }

    get attackerAvatar() {
        if (!this.combatData) return '';
        const player = this.inGameService.getPlayerByPlayerId(this.combatData.attackerId);
        return this.assetsService.getAvatarStaticImage(player.avatar);
    }

    get targetName() {
        return this.combatData ? this.inGameService.getPlayerByPlayerId(this.combatData.targetId).name : '';
    }

    get targetAvatar() {
        if (!this.combatData) return '';
        const player = this.inGameService.getPlayerByPlayerId(this.combatData.targetId);
        return this.assetsService.getAvatarStaticImage(player.avatar);
    }

    chooseOffensive(): void {
        const sessionId = this.inGameService.sessionId();
        this.combatService.chooseOffensive(sessionId);
    }

    chooseDefensive(): void {
        const sessionId = this.inGameService.sessionId();
        this.combatService.chooseDefensive(sessionId);
    }
}
