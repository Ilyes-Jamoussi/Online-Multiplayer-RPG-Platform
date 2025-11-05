import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CombatTimerComponent } from '@app/components/features/combat-timer/combat-timer.component';
import { PERCENTAGE_MULTIPLIER } from '@app/constants/player.constants';
import { AssetsService } from '@app/services/assets/assets.service';
import { CombatService } from '@app/services/combat/combat.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { Dice } from '@common/enums/dice.enum';
import { TileCombatEffect } from '@common/enums/tile.enum';

@Component({
    selector: 'app-combat-overlay',
    standalone: true,
    imports: [CommonModule, CombatTimerComponent],
    templateUrl: './combat-overlay.component.html',
    styleUrls: ['./combat-overlay.component.scss'],
})
export class CombatOverlayComponent {
    constructor(
        private readonly combatService: CombatService,
        private readonly inGameService: InGameService,
        private readonly assetsService: AssetsService,
        private readonly timerCoordinatorService: TimerCoordinatorService,
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

    get playerAHealth() {
        if (!this.combatData) return { current: 0, max: 0, percentage: 0 };
        const player = this.inGameService.getPlayerByPlayerId(this.combatData.attackerId);
        const minHealth = this.combatService.minHealthDuringCombat();
        const displayedHealth = this.victoryData ? Math.max(0, minHealth[this.combatData.attackerId] ?? player.health) : player.health;
        return {
            current: displayedHealth,
            max: player.maxHealth,
            percentage: (displayedHealth / player.maxHealth) * PERCENTAGE_MULTIPLIER,
        };
    }

    get playerBHealth() {
        if (!this.combatData) return { current: 0, max: 0, percentage: 0 };
        const player = this.inGameService.getPlayerByPlayerId(this.combatData.targetId);
        const minHealth = this.combatService.minHealthDuringCombat();
        const displayedHealth = this.victoryData ? Math.max(0, minHealth[this.combatData.targetId] ?? player.health) : player.health;
        return {
            current: displayedHealth,
            max: player.maxHealth,
            percentage: (displayedHealth / player.maxHealth) * PERCENTAGE_MULTIPLIER,
        };
    }

    get playerADamage() {
        return (
            this.combatService
                .damageDisplays()
                .find((damageDisplay) => damageDisplay.playerId === this.combatData?.attackerId && damageDisplay.visible) || null
        );
    }

    get playerBDamage() {
        return (
            this.combatService
                .damageDisplays()
                .find((damageDisplay) => damageDisplay.playerId === this.combatData?.targetId && damageDisplay.visible) || null
        );
    }

    get selectedPosture() {
        return this.combatService.selectedPosture();
    }

    get isPostureSelected(): boolean {
        return this.selectedPosture !== null;
    }

    get playerAPosture(): CombatPosture | null {
        if (!this.combatData) return null;
        return this.combatService.playerPostures()[this.combatData.attackerId] || null;
    }

    get playerBPosture(): CombatPosture | null {
        if (!this.combatData) return null;
        return this.combatService.playerPostures()[this.combatData.targetId] || null;
    }

    get victoryData() {
        return this.combatService.victoryData();
    }

    get victoryMessage(): string {
        if (!this.victoryData) return '';

        const myId = this.combatData?.userRole === 'attacker' ? this.combatData.attackerId : this.combatData?.targetId;

        if (this.victoryData.winnerId === null) {
            return 'Match Nul !';
        }

        if (this.victoryData.winnerId === myId) {
            return 'Victoire !';
        }

        const winnerName = this.inGameService.getPlayerByPlayerId(this.victoryData.winnerId).name;
        return `${winnerName} a gagné !`;
    }

    get victorySubtitle(): string {
        if (!this.victoryData) return '';

        const myId = this.combatData?.userRole === 'attacker' ? this.combatData.attackerId : this.combatData?.targetId;

        if (this.victoryData.abandon) {
            if (this.victoryData.winnerId === myId) {
                return 'Victoire par abandon !';
            } else {
                return 'Défaite par abandon...';
            }
        }

        if (this.victoryData.winnerId === null) {
            return 'Les deux combattants sont tombés';
        }

        if (this.victoryData.winnerId === myId) {
            return 'Tu as gagné le combat !';
        }

        return 'Tu as perdu le combat...';
    }

    get isVictory(): boolean {
        if (!this.victoryData) return false;
        const myId = this.combatData?.userRole === 'attacker' ? this.combatData.attackerId : this.combatData?.targetId;
        return this.victoryData.winnerId === myId;
    }

    get spectatorVictoryTitle(): string {
        if (!this.victoryData) return '';

        if (this.victoryData.winnerId === null) {
            return 'Match Nul !';
        }

        const winnerName = this.inGameService.getPlayerByPlayerId(this.victoryData.winnerId).name;
        return `${winnerName} a gagné !`;
    }

    get spectatorVictoryMessage(): string {
        if (!this.victoryData) return '';

        if (this.victoryData.winnerId === null) {
            return 'Les deux combattants sont tombés';
        }

        const winnerName = this.inGameService.getPlayerByPlayerId(this.victoryData.winnerId).name;
        const loserName = this.inGameService.getPlayerByPlayerId(
            this.victoryData.winnerId === this.victoryData.playerAId ? this.victoryData.playerBId : this.victoryData.playerAId,
        ).name;

        if (this.victoryData.abandon) {
            return `${winnerName} a gagné par abandon contre ${loserName}`;
        }

        return `${winnerName} a vaincu ${loserName}`;
    }

    chooseOffensive(): void {
        this.combatService.chooseOffensive();
    }

    chooseDefensive(): void {
        this.combatService.chooseDefensive();
    }

    get playerATileEffect(): TileCombatEffect | null {
        if (!this.combatData) return null;
        return this.combatService.tileEffects()[this.combatData.attackerId] ?? null;
    }

    get playerBTileEffect(): TileCombatEffect | null {
        if (!this.combatData) return null;
        return this.combatService.tileEffects()[this.combatData.targetId] ?? null;
    }

    get playerATileEffectLabel(): string | null {
        const effect = this.playerATileEffect;
        if (effect === null || effect === TileCombatEffect.BASE) return null;
        if (effect === TileCombatEffect.ICE) return `Glace ${effect}`;
        return null;
    }

    get playerBTileEffectLabel(): string | null {
        const effect = this.playerBTileEffect;
        if (effect === null || effect === TileCombatEffect.BASE) return null;
        if (effect === TileCombatEffect.ICE) return `Glace ${effect}`;
        return null;
    }

    getDiceImage(dice: Dice): string {
        return this.assetsService.getDiceImage(dice);
    }

    get pausedTurnTime(): number {
        return this.timerCoordinatorService.getPausedTurnTime();
    }

    get isVictoryNotificationVisible(): boolean {
        return this.combatService.isVictoryNotificationVisible();
    }

    closeVictoryOverlay(): void {
        this.combatService.closeVictoryOverlay();
    }
}
