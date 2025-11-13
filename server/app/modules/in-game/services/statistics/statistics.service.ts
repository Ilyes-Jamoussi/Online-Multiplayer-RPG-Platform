import { Injectable } from '@nestjs/common';
import {
    DEFAULT_HEALTH_DEALT_MULTIPLIER,
    MILLISECONDS_PER_SECOND,
    SECONDS_PER_MINUTE,
    STATISTICS_DELETE_DELAY_MS,
} from '@app/constants/statistics.constants';
import { GameStatisticsDto, PlayerStatisticsDto, GlobalStatisticsDto } from '@app/modules/in-game/dto/game-statistics.dto';
import { InGameSession } from '@common/interfaces/session.interface';
import { Player } from '@common/interfaces/player.interface';
import { StoredStatistics } from '@common/interfaces/game-statistics.interface';

@Injectable()
export class StatisticsService {
    private readonly sessionStatistics = new Map<string, StoredStatistics>();

    calculateAndStoreGameStatistics(session: InGameSession, winnerId: string, winnerName: string, gameStartTime: Date): GameStatisticsDto {
        const statistics = this.calculateGameStatistics(session, winnerId, winnerName, gameStartTime);
        
        this.sessionStatistics.set(session.id, {
            data: statistics,
            timestamp: Date.now(),
        });

        setTimeout(() => {
            this.sessionStatistics.delete(session.id);
        }, STATISTICS_DELETE_DELAY_MS);

        return statistics;
    }

    getStoredGameStatistics(sessionId: string): GameStatisticsDto | null {
        const stored = this.sessionStatistics.get(sessionId);
        return stored ? stored.data : null;
    }

    private calculateGameStatistics(session: InGameSession, winnerId: string, winnerName: string, gameStartTime: Date): GameStatisticsDto {
        const players = Object.values(session.inGamePlayers).filter(player => player.isInGame);
        
        const playersStatistics = players.map(player => this.calculatePlayerStatistics(player));
        const globalStatistics = this.calculateGlobalStatistics(session, gameStartTime);

        return {
            winnerId,
            winnerName,
            playersStatistics,
            globalStatistics,
        };
    }

    private calculatePlayerStatistics(player: Player): PlayerStatisticsDto {
        const healthLost = player.maxHealth - player.health;
        const healthDealt = player.combatWins * DEFAULT_HEALTH_DEALT_MULTIPLIER;

        return {
            name: player.name,
            combatCount: player.combatCount,
            combatWins: player.combatWins,
            combatLosses: player.combatLosses,
            healthLost,
            healthDealt,
            tilesVisitedPercentage: 0,
        };
    }

    private calculateGlobalStatistics(session: InGameSession, gameStartTime: Date): GlobalStatisticsDto {
        const gameDuration = this.formatDuration(Date.now() - gameStartTime.getTime());
        
        return {
            gameDuration,
            totalTurns: session.currentTurn.turnNumber,
            tilesVisitedPercentage: 0,
            totalTeleportations: 0,
            doorsManipulatedPercentage: 0,
            sanctuariesUsedPercentage: 0,
            flagHoldersCount: 0,
        };
    }

    private formatDuration(milliseconds: number): string {
        const totalSeconds = Math.floor(milliseconds / MILLISECONDS_PER_SECOND);
        const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
        const seconds = totalSeconds % SECONDS_PER_MINUTE;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
