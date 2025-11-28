import { Injectable } from '@nestjs/common';
import { Position } from '@common/interfaces/position.interface';
import { MapSize } from '@common/enums/map-size.enum';

interface GameTracker {
    sessionId: string;
    playerTiles: Map<string, Set<string>>;
    totalTiles: number;
    teleportations: number;
    toggledDoors: Set<string>;
    totalDoors: number;
    usedSanctuaries: Set<string>;
    totalSanctuaries: number;
    totalTeleportTiles: number;
    flagHolders: Set<string>;
}

@Injectable()
export class TrackingService {
    private readonly gameTrackers = new Map<string, GameTracker>();

    initializeTracking(sessionId: string, mapSize: MapSize, totalDoors: number, totalSanctuaries: number, totalTeleportTiles: number): void {
        this.gameTrackers.set(sessionId, {
            sessionId,
            playerTiles: new Map(),
            totalTiles: mapSize * mapSize,
            teleportations: 0,
            toggledDoors: new Set(),
            totalDoors,
            usedSanctuaries: new Set(),
            totalSanctuaries,
            totalTeleportTiles,
            flagHolders: new Set(),
        });
    }

    trackTileVisited(sessionId: string, playerId: string, position: Position): void {
        const tracker = this.gameTrackers.get(sessionId);
        if (tracker) {
            if (!tracker.playerTiles.has(playerId)) {
                tracker.playerTiles.set(playerId, new Set());
            }
            const playerTiles = tracker.playerTiles.get(playerId);
            if (playerTiles) {
                playerTiles.add(`${position.x},${position.y}`);
            }
        }
    }

    trackTeleportation(sessionId: string): void {
        const tracker = this.gameTrackers.get(sessionId);
        if (tracker) {
            tracker.teleportations++;
        }
    }

    trackDoorToggled(sessionId: string, position: Position): void {
        const tracker = this.gameTrackers.get(sessionId);
        if (tracker) {
            tracker.toggledDoors.add(`${position.x},${position.y}`);
        }
    }

    trackSanctuaryUsed(sessionId: string, position: Position): void {
        const tracker = this.gameTrackers.get(sessionId);
        if (tracker) {
            tracker.usedSanctuaries.add(`${position.x},${position.y}`);
        }
    }

    trackFlagHolder(sessionId: string, playerId: string): void {
        const tracker = this.gameTrackers.get(sessionId);
        if (tracker) {
            tracker.flagHolders.add(playerId);
        }
    }

    getTrackingData(sessionId: string): GameTracker | null {
        return this.gameTrackers.get(sessionId) || null;
    }

    removeTracking(sessionId: string): void {
        this.gameTrackers.delete(sessionId);
    }
}

export { GameTracker };
