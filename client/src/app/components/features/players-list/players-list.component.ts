import { CommonModule } from '@angular/common';
import { Component, computed, Signal } from '@angular/core';
import { BASE_WHITE_VALUE, COLOR_MIX_RATIO, HEX_BLUE_START_INDEX, HEX_COLOR_LENGTH } from '@app/constants/color.constants';
import { HP_HIGH_THRESHOLD_PERCENT, HP_MEDIUM_THRESHOLD_PERCENT, PERCENTAGE_MULTIPLIER } from '@app/constants/player.constants';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { TeamColor } from '@app/enums/team-color.enum';
import { Player } from '@common/interfaces/player.interface';

@Component({
    selector: 'app-players-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './players-list.component.html',
    styleUrl: './players-list.component.scss',
})
export class PlayersListComponent {
    readonly hpHighThreshold = HP_HIGH_THRESHOLD_PERCENT;
    readonly hpMediumThreshold = HP_MEDIUM_THRESHOLD_PERCENT;

    constructor(
        private readonly inGameService: InGameService,
        private readonly playerService: PlayerService,
        private readonly assetsService: AssetsService,
    ) {}

    readonly orderedPlayers: Signal<Player[]> = computed(() => {
        const turnOrder = this.inGameService.turnOrder();
        const players = this.inGameService.inGamePlayers();

        return turnOrder.map((playerId) => players[playerId]);
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

    getPlayerAvatar(avatar: Avatar | null): string {
        return this.assetsService.getAvatarStaticImage(avatar);
    }

    getTeamNumber(player: Player): number | undefined {
        return player.teamNumber;
    }

    getTeamColor(teamNumber: number | undefined, player?: Player, forTeamBadge: boolean = false): string | undefined {
        if (player) {
            if (this.isCurrentUser(player)) {
                if (forTeamBadge) {
                    return this.playerService.getTeamColor(teamNumber);
                }
                return TeamColor.MyPlayer;
            }
            if (!this.isCTFMode()) {
                return TeamColor.EnemyTeam;
            }
        }
        return this.playerService.getTeamColor(teamNumber);
    }

    getTeamBackgroundColor(teamNumber: number | undefined, player?: Player): string | undefined {
        const teamColor = this.getTeamColor(teamNumber, player);
        if (!teamColor) return undefined;

        const hex = teamColor.replace('#', '');
        const red = parseInt(hex.substring(0, HEX_COLOR_LENGTH), 16);
        const green = parseInt(hex.substring(HEX_COLOR_LENGTH, HEX_COLOR_LENGTH + HEX_COLOR_LENGTH), 16);
        const blue = parseInt(hex.substring(HEX_BLUE_START_INDEX, HEX_BLUE_START_INDEX + HEX_COLOR_LENGTH), 16);

        const finalRed = Math.round(BASE_WHITE_VALUE - (BASE_WHITE_VALUE - red) * COLOR_MIX_RATIO);
        const finalGreen = Math.round(BASE_WHITE_VALUE - (BASE_WHITE_VALUE - green) * COLOR_MIX_RATIO);
        const finalBlue = Math.round(BASE_WHITE_VALUE - (BASE_WHITE_VALUE - blue) * COLOR_MIX_RATIO);

        return `rgb(${finalRed}, ${finalGreen}, ${finalBlue})`;
    }

    hasFlag(player: Player): boolean {
        const flagData = this.inGameService.flagData();
        return flagData?.holderPlayerId === player.id;
    }

    isVirtualPlayer(player: Player): boolean {
        return Boolean(player.virtualPlayerType);
    }

    isCTFMode(): boolean {
        return this.inGameService.mode() === GameMode.CTF;
    }

    isEnemy(player: Player): boolean {
        if (this.isCurrentUser(player)) return false;
        if (this.isCTFMode()) return false;
        return true;
    }
}
