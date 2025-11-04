import { ReachableTileExplorationContext } from '@app/interfaces/reachable-tile-exploration-context.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileCost, TileKind } from '@common/enums/tile.enum';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InGameMovementService {
    constructor(
        private readonly gameCache: GameCacheService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    movePlayer(session: InGameSession, playerId: string, orientation: Orientation): number {
        const player = session.inGamePlayers[playerId];
        if (!player) {
            throw new NotFoundException('Player not found');
        }

        const { x: nextX, y: nextY } = this.gameCache.getNextPosition(session.id, player.x, player.y, orientation);
        const tile = this.gameCache.getTileAtPosition(session.id, nextX, nextY);
        if (!tile) {
            throw new NotFoundException('Tile not found');
        }

        const doorCost = tile.open ? TileCost.DOOR_OPEN : -1;
        const moveCost = tile.kind === TileKind.DOOR ? doorCost : TileCost[tile.kind];

        if (moveCost === -1) {
            throw new BadRequestException('Cannot move onto this tile');
        } else if (moveCost > player.speed) {
            throw new BadRequestException('Not enough movement points for this tile');
        }

        if (this.gameCache.getTileOccupant(session.id, nextX, nextY)) {
            throw new BadRequestException('Tile is occupied');
        }

        this.sessionRepository.movePlayerPosition(session.id, playerId, nextX, nextY, moveCost);

        if (player.speed > 0) {
            this.calculateReachableTiles(session, playerId);
        } else {
            this.eventEmitter.emit('player.reachableTiles', { playerId, reachable: [] });
        }

        return player.speed;
    }

    movePlayerToStartPosition(session: InGameSession, playerId: string): void {
        const player = session.inGamePlayers[playerId];
        if (!player) {
            throw new NotFoundException('Player not found');
        }
        const startPointId = player.startPointId;
        const startPoint = this.sessionRepository.findStartPointById(session.id, startPointId);
        if (!startPoint) {
            throw new NotFoundException('Start point not found');
        }
        if (!(startPoint.x === player.x && startPoint.y === player.y)) {
            const { x: nextX, y: nextY } = this.findClosestFreeTile(session, startPoint.x, startPoint.y);
            player.health = player.maxHealth;
            this.sessionRepository.movePlayerPosition(session.id, playerId, nextX, nextY, 0);
        }
        this.calculateReachableTiles(session, session.currentTurn.activePlayerId);
    }

    calculateReachableTiles(session: InGameSession, playerId: string): ReachableTile[] {
        const player = session.inGamePlayers[playerId];
        if (!player) {
            throw new NotFoundException('Player not found');
        }

        const reachable: ReachableTile[] = [];
        const visited = new Set<string>();
        const queue: ReachableTile[] = this.initializeQueue(player);
        const isOnBoat = this.isPlayerOnBoat(session.id, player.x, player.y);
        const mapSize = this.gameCache.getMapSize(session.id);
        const startPosition = { x: player.x, y: player.y };

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;

            if (!this.processCurrentTile(current, visited, reachable, startPosition)) continue;

            const context: ReachableTileExplorationContext = { session, playerId, visited, queue, mapSize, isOnBoat };
            this.exploreNeighbors(current, context);
        }

        this.eventEmitter.emit('player.reachableTiles', { playerId, reachable });
        return reachable;
    }

    private initializeQueue(player: InGameSession['inGamePlayers'][string]): ReachableTile[] {
        return [
            {
                x: player.x,
                y: player.y,
                cost: 0,
                remainingPoints: player.speed,
            },
        ];
    }

    private processCurrentTile(
        current: ReachableTile,
        visited: Set<string>,
        reachable: ReachableTile[],
        startPosition: { x: number; y: number },
    ): boolean {
        const key = `${current.x},${current.y}`;

        if (visited.has(key)) return false;
        visited.add(key);

        const isStartPosition = current.x === startPosition.x && current.y === startPosition.y;
        if (!isStartPosition) {
            reachable.push(current);
        }

        return true;
    }

    private exploreNeighbors(current: ReachableTile, context: ReachableTileExplorationContext): void {
        const directions = this.getAdjacentPositions(current);

        for (const next of directions) {
            if (this.shouldSkipPosition(next, context.visited, context.mapSize)) continue;

            const tileCost = this.calculateTileCost(context.session.id, next.x, next.y, context.isOnBoat);
            if (tileCost === null) continue;

            if (this.isPositionOccupied(context.session, next.x, next.y)) continue;

            const newRemainingPoints = current.remainingPoints - tileCost;
            if (newRemainingPoints < 0) continue;

            context.queue.push({
                x: next.x,
                y: next.y,
                cost: current.cost + tileCost,
                remainingPoints: newRemainingPoints,
            });
        }
    }

    private getAdjacentPositions(current: ReachableTile): { x: number; y: number }[] {
        return [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 },
        ];
    }

    private shouldSkipPosition(next: { x: number; y: number }, visited: Set<string>, mapSize: number): boolean {
        const nextKey = `${next.x},${next.y}`;
        if (visited.has(nextKey)) return true;

        if (next.x < 0 || next.x >= mapSize || next.y < 0 || next.y >= mapSize) {
            return true;
        }

        return false;
    }

    private calculateTileCost(sessionId: string, x: number, y: number, isOnBoat: boolean): number | null {
        const tile = this.gameCache.getTileAtPosition(sessionId, x, y);
        if (!tile) return null;

        let tileCost = TileCost[tile.kind];
        if (tileCost === undefined) return null;

        if (tile.kind === TileKind.DOOR) {
            tileCost = tile.open ? TileCost.DOOR_OPEN : -1;
        }

        if (tileCost === -1) return null;

        if (tile.kind === TileKind.WATER && isOnBoat) {
            return 1;
        }

        return tileCost;
    }

    private isPlayerOnBoat(sessionId: string, x: number, y: number): boolean {
        const placeables = this.gameCache.getPlaceablesAtPosition(sessionId, x, y);
        return placeables.some((placeable) => placeable.kind === PlaceableKind.BOAT);
    }

    private isPositionOccupied(session: InGameSession, x: number, y: number): boolean {
        return Boolean(this.gameCache.getTileOccupant(session.id, x, y));
    }

    private findClosestFreeTile(session: InGameSession, x: number, y: number): { x: number; y: number } {
        const mapSize = this.gameCache.getMapSize(session.id);

        if (this.gameCache.isTileFree(session.id, x, y)) {
            return { x, y };
        }

        const visited = new Set<string>();
        const queue: { x: number; y: number; distance: number }[] = [{ x, y, distance: 0 }];
        visited.add(`${x},${y}`);

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;

            const neighbors = [
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y },
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 },
            ];

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;

                if (neighbor.x < 0 || neighbor.x >= mapSize || neighbor.y < 0 || neighbor.y >= mapSize) {
                    continue;
                }

                if (visited.has(key)) {
                    continue;
                }

                visited.add(key);
                if (this.gameCache.isTileFree(session.id, neighbor.x, neighbor.y)) {
                    return { x: neighbor.x, y: neighbor.y };
                }

                queue.push({ x: neighbor.x, y: neighbor.y, distance: current.distance + 1 });
            }
        }

        throw new NotFoundException('No free tile found near start point');
    }
}
