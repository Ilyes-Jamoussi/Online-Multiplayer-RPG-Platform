import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CombatTimerComponent } from '@app/components/features/combat-timer/combat-timer.component';
import { CombatService } from '@app/services/combat/combat.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { Dice } from '@common/enums/dice.enum';

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

    get playerAName() {
        return this.combatData ? this.inGameService.getPlayerByPlayerId(this.combatData.attackerId).name : '';
    }

    get playerAAvatar() {
        if (!this.combatData) return '';
        const player = this.inGameService.getPlayerByPlayerId(this.combatData.attackerId);
        return this.assetsService.getAvatarStaticImage(player.avatar);
    }

    get playerBName() {
        return this.combatData ? this.inGameService.getPlayerByPlayerId(this.combatData.targetId).name : '';
    }

    get playerBAvatar() {
        if (!this.combatData) return '';
        const player = this.inGameService.getPlayerByPlayerId(this.combatData.targetId);
        return this.assetsService.getAvatarStaticImage(player.avatar);
    }

    get playerADamage() {
        return this.combatService.damageDisplays().find(d => d.playerId === this.combatData?.attackerId && d.visible) || null;
    }

    get playerBDamage() {
        return this.combatService.damageDisplays().find(d => d.playerId === this.combatData?.targetId && d.visible) || null;
    }

    get selectedPosture() {
        return this.combatService.selectedPosture();
    }

    get isPostureSelected(): boolean {
        return this.selectedPosture !== null;
    }

    get diceD4Image(): string {
        return this.assetsService.getDiceImage(Dice.D4);
    }

    get diceD6Image(): string {
        return this.assetsService.getDiceImage(Dice.D6);
    }

    getDiceImageForDisplay(dice: Dice): string {
        return dice === Dice.D4 ? this.diceD4Image : this.diceD6Image;
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
