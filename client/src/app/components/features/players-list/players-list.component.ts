import { Component, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { PERCENTAGE_MULTIPLIER } from '@app/constants/player.constants';
import { Player } from '@common/models/player.interface';

@Component({
    selector: 'app-players-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './players-list.component.html',
    styleUrl: './players-list.component.scss'
})
export class PlayersListComponent {
    constructor(
        private readonly inGameService: InGameService,
        private readonly playerService: PlayerService,
    ) {}

    readonly orderedPlayers: Signal<Player[]> = computed(() => {
        const turnOrder = this.inGameService.turnOrder();
        const players = this.inGameService.inGamePlayers();
        
        return turnOrder.map(playerId => players[playerId]);
    });

    isActivePlayer(player: Player): boolean {
        return player.id === this.inGameService.activePlayer?.id;
    }

    isCurrentUser(player: Player): boolean {
        return player.id === this.playerService.id();
    }

    isAdmin(player: Player): boolean {
        return player.isAdmin;
    }

    hasAbandoned(player: Player): boolean {
        return !player.isInGame;
    }

    getCombatWins(player: Player): number {
        return player.combatWins;
    }

    getHealthPercentage(player: Player): number {
        if (player.maxHealth === 0) return 0;
        return (player.health / player.maxHealth) * PERCENTAGE_MULTIPLIER;
    }
}
