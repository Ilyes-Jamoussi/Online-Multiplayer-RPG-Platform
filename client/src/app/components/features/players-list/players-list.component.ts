import { Component, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { InGamePlayer } from '@common/models/player.interface';

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

    readonly orderedPlayers: Signal<InGamePlayer[]> = computed(() => {
        const turnOrder = this.inGameService.turnOrderPlayerId();
        const players = this.inGameService.inGamePlayers();
        
        return turnOrder.map(playerId => players[playerId]).filter(Boolean);
    });

    isActivePlayer(player: InGamePlayer): boolean {
        return player.id === this.inGameService.activePlayer?.id;
    }

    isCurrentUser(player: InGamePlayer): boolean {
        return player.id === this.playerService.id();
    }

    isAdmin(player: InGamePlayer): boolean {
        return player.isAdmin;
    }

    hasAbandoned(player: InGamePlayer): boolean {
        return !player.isInGame;
    }

    getCombatWins(): number {
        // TODO: Implement combat wins tracking
        return 0;
    }
}
