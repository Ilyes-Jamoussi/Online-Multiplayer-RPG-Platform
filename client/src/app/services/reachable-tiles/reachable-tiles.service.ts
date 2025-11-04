import { Injectable } from '@angular/core';
import { TileCost, TileKind } from '@common/enums/tile-kind.enum';

export interface Position {
    x: number;
    y: number;
}

export interface ReachableTile extends Position {
    cost: number;
    remainingPoints: number;
}

export interface ReachableTilesOptions {
    startX: number;
    startY: number;
    speed: number;
    getTileKind: (x: number, y: number) => TileKind | null;
    isOccupied: (x: number, y: number) => boolean;
    isOnBoat?: boolean;
    hasSanctuary?: (x: number, y: number) => boolean;
}

@Injectable({ providedIn: 'root' })
export class ReachableTilesService {
    calculateReachableTiles(options: ReachableTilesOptions): ReachableTile[] {
        const { startX, startY, speed, getTileKind, isOccupied, isOnBoat = false, hasSanctuary = () => false } = options;
        const reachable: ReachableTile[] = [];
        const visited = new Set<string>();
        const queue: ReachableTile[] = [{ x: startX, y: startY, cost: 0, remainingPoints: speed }];

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;

            const key = `${current.x},${current.y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            reachable.push(current);

            const directions = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 },
            ];

            for (const next of directions) {
                const nextKey = `${next.x},${next.y}`;
                if (visited.has(nextKey)) continue;

                const tileKind = getTileKind(next.x, next.y);
                if (!tileKind) continue;

                if (hasSanctuary(next.x, next.y)) continue;

                let tileCost = TileCost[tileKind as keyof typeof TileCost];
                if (tileCost === -1) continue;
                if (isOccupied(next.x, next.y)) continue;

                if (tileKind === TileKind.WATER && isOnBoat) {
                    tileCost = 1;
                }

                const newRemainingPoints = current.remainingPoints - tileCost;
                if (newRemainingPoints < 0) continue;

                queue.push({
                    x: next.x,
                    y: next.y,
                    cost: current.cost + tileCost,
                    remainingPoints: newRemainingPoints,
                });
            }
        }

        return reachable;
    }
}
