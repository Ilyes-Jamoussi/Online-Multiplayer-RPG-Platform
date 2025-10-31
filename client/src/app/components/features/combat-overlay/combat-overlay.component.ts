import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { CombatTimerComponent } from '@app/components/features/combat-timer/combat-timer.component';
import { CombatService } from '@app/services/combat/combat.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { Dice } from '@common/enums/dice.enum';

interface DamageDisplay {
    playerId: string;
    damage: number;
    roll: number;
    dice: Dice;
    visible: boolean;
}

@Component({
    selector: 'app-combat-overlay',
    standalone: true,
    imports: [CommonModule, CombatTimerComponent],
    templateUrl: './combat-overlay.component.html',
    styleUrls: ['./combat-overlay.component.scss']
})
export class CombatOverlayComponent implements OnInit {
    private readonly damageDisplays = signal<DamageDisplay[]>([]);

    constructor(
        private readonly combatService: CombatService,
        private readonly inGameService: InGameService,
        private readonly inGameSocketService: InGameSocketService,
        private readonly assetsService: AssetsService
    ) {}

    ngOnInit(): void {
        this.inGameSocketService.onPlayerCombatResult((data) => {
            if (data.damageToA > 0) {
                this.showDamage(data.playerAId, data.damageToA, data.playerARoll, data.playerADice);
            }
            if (data.damageToB > 0) {
                this.showDamage(data.playerBId, data.damageToB, data.playerBRoll, data.playerBDice);
            }
        });
    }

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

    get playerADamage(): DamageDisplay | null {
        return this.damageDisplays().find(d => d.playerId === this.combatData?.attackerId && d.visible) || null;
    }

    get playerBDamage(): DamageDisplay | null {
        return this.damageDisplays().find(d => d.playerId === this.combatData?.targetId && d.visible) || null;
    }

    private showDamage(playerId: string, damage: number, roll: number, dice: Dice): void {
        if (damage <= 0) return;
        
        this.damageDisplays.update(displays => [
            ...displays.filter(d => d.playerId !== playerId),
            { playerId, damage, roll, dice, visible: true }
        ]);

        setTimeout(() => {
            this.damageDisplays.update(displays => 
                displays.map(d => d.playerId === playerId ? { ...d, visible: false } : d)
            );
        }, 2000);
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
