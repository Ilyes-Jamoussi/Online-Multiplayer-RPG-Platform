import { Injectable } from '@nestjs/common';
import {
    DEFAULT_HEALTH_DEALT_MULTIPLIER,
    MILLISECONDS_PER_SECOND,
    PERCENTAGE_MULTIPLIER,
    SECONDS_PER_MINUTE,
    STATISTICS_DELETE_DELAY_MS,
} from '@app/constants/statistics.constants';
import { GameStatisticsDto, PlayerStatisticsDto, GlobalStatisticsDto } from '@app/modules/in-game/dto/game-statistics.dto';
import { TrackingService, GameTracker } from '@app/modules/in-game/services/tracking/tracking.service';
import { MapSize } from '@common/enums/map-size.enum';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Player } from '@common/interfaces/player.interface';
import { StoredStatistics } from '@common/interfaces/game-statistics.interface';

@Injectable()
export class StatisticsService {
    private readonly sessionStatistics = new Map<string, StoredStatistics>();

    constructor(private readonly trackingService: TrackingService) {}

    initializeTracking(sessionId: string, mapSize: MapSize, totalDoors: number, totalSanctuaries: number): void {
        this.trackingService.initializeTracking(sessionId, mapSize, totalDoors, totalSanctuaries);
    }

    trackTileVisited(sessionId: string, playerId: string, position: Position): void {
        this.trackingService.trackTileVisited(sessionId, playerId, position);
    }

    calculateAndStoreGameStatistics(session: InGameSession, winnerId: string, winnerName: string, gameStartTime: Date): GameStatisticsDto {
        const trackingData = this.trackingService.getTrackingData(session.id);
        const statistics = this.calculateGameStatistics(session, trackingData, winnerId, winnerName, gameStartTime);

        this.sessionStatistics.set(session.id, {
            data: statistics,
            timestamp: Date.now(),
        });

        setTimeout(() => {
            this.sessionStatistics.delete(session.id);
        }, STATISTICS_DELETE_DELAY_MS);

        this.trackingService.removeTracking(session.id);
        return statistics;
    }

    getStoredGameStatistics(sessionId: string): GameStatisticsDto | null {
        const stored = this.sessionStatistics.get(sessionId);
        return stored ? stored.data : null;
    }

    private calculateGameStatistics(
        session: InGameSession,
        trackingData: GameTracker,
        winnerId: string,
        winnerName: string,
        gameStartTime: Date,
    ): GameStatisticsDto {
        const players = Object.values(session.inGamePlayers).filter((player) => player.isInGame);

        const playersStatistics = players.map((player) => this.calculatePlayerStatistics(player, trackingData));
        const globalStatistics = this.calculateGlobalStatistics(session, trackingData, gameStartTime);

        return {
            winnerId,
            winnerName,
            playersStatistics,
            globalStatistics,
        };
    }

    private calculatePlayerStatistics(player: Player, trackingData: GameTracker): PlayerStatisticsDto {
        const healthLost = player.maxHealth - player.health;
        const healthDealt = player.combatWins * DEFAULT_HEALTH_DEALT_MULTIPLIER;

        let tilesVisitedPercentage = 0;
        if (trackingData?.playerTiles?.has(player.id)) {
            const playerTiles = trackingData.playerTiles.get(player.id);
            tilesVisitedPercentage = Math.round((playerTiles.size / trackingData.totalTiles) * PERCENTAGE_MULTIPLIER);
        }

        return {
            name: player.name,
            combatCount: player.combatCount,
            combatWins: player.combatWins,
            combatLosses: player.combatLosses,
            healthLost,
            healthDealt,
            tilesVisitedPercentage,
        };
    }

    private calculateGlobalStatistics(session: InGameSession, trackingData: GameTracker, gameStartTime: Date): GlobalStatisticsDto {
        const gameDuration = this.formatDuration(Date.now() - gameStartTime.getTime());

        let globalTilesVisitedPercentage = 0;
        if (trackingData?.playerTiles) {
            const allVisitedTiles = new Set<string>();
            trackingData.playerTiles.forEach((tiles: Set<string>) => {
                tiles.forEach((tile) => allVisitedTiles.add(tile));
            });
            globalTilesVisitedPercentage = Math.round((allVisitedTiles.size / trackingData.totalTiles) * PERCENTAGE_MULTIPLIER);
        }

        return {
            gameDuration,
            totalTurns: session.currentTurn.turnNumber,
            tilesVisitedPercentage: globalTilesVisitedPercentage,
            totalTeleportations: trackingData?.teleportations || 0,
            doorsManipulatedPercentage: Math.round((trackingData.toggledDoors.size / trackingData.totalDoors) * PERCENTAGE_MULTIPLIER),
            sanctuariesUsedPercentage: Math.round((trackingData.usedSanctuaries.size / trackingData.totalSanctuaries) * PERCENTAGE_MULTIPLIER),
            flagHoldersCount: trackingData?.flagHolders.size || 0,
        };
    }

    private formatDuration(milliseconds: number): string {
        const totalSeconds = Math.floor(milliseconds / MILLISECONDS_PER_SECOND);
        const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
        const seconds = totalSeconds % SECONDS_PER_MINUTE;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
