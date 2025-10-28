import { InGameSession } from '@common/models/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GameCacheService } from './game-cache.service';
import { TileCost, TileKind } from '@common/enums/tile-kind.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';

interface ReachableTileExplorationContext {
    session: InGameSession;
    playerId: string;
    visited: Set<string>;
    queue: ReachableTile[];
    mapSize: number;
    isOnBoat: boolean;
}

@Injectable()
export class InGameMovementService {
    constructor(
        private readonly gameCache: GameCacheService,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    movePlayer(session: InGameSession, playerId: string, orientation: Orientation): void {
        const player = session.inGamePlayers[playerId];
        if (!player) {
            throw new NotFoundException('Player not found');
        }

        const { x: nextX, y: nextY } = this.gameCache.getNextPosition(session.id, player.x, player.y, orientation);
        const tile = this.gameCache.getTileAtPosition(session.id, nextX, nextY);
        if (!tile) {
            throw new NotFoundException('Tile not found');
        }

        const moveCost = TileCost[tile.kind];
        if (moveCost === -1) {
            throw new BadRequestException('Cannot move onto this tile');
        } else if (moveCost > player.movementPoints) {
            throw new BadRequestException('Not enough movement points for this tile');
        }

        if (this.gameCache.getTileOccupant(session.id, nextX, nextY)) {
            throw new BadRequestException('Tile is occupied');
        }

        this.gameCache.moveTileOccupant(session.id, nextX, nextY, player);

        player.x = nextX;
        player.y = nextY;
        player.movementPoints -= moveCost;

        this.eventEmitter.emit('player.moved', {
            session,
            playerId,
            x: nextX,
            y: nextY,
            movementPoints: player.movementPoints,
        });

        if (player.movementPoints) {
            this.calculateReachableTiles(session, playerId);
        } else {
            this.eventEmitter.emit('player.reachableTiles', { playerId, reachable: [] });
        }
    }

    calculateReachableTiles(session: InGameSession, playerId: string): void {
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
    }

    private initializeQueue(player: InGameSession['inGamePlayers'][string]): ReachableTile[] {
        return [
            {
                x: player.x,
                y: player.y,
                cost: 0,
                remainingPoints: player.movementPoints,
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

        const tileCost = TileCost[tile.kind as keyof typeof TileCost];
        if (tileCost === undefined) return null;
        if (tileCost === -1) return null;

        if (tile.kind === TileKind.DOOR && !tile.open) {
            return null;
        }

        if (tile.kind === TileKind.WATER && isOnBoat) {
            return 1;
        }

        return tileCost;
    }

    private isPlayerOnBoat(sessionId: string, x: number, y: number): boolean {
        const placeables = this.gameCache.getPlaceablesAtPosition(sessionId, x, y);
        return placeables.some((p) => p.kind === PlaceableKind.BOAT);
    }

    private isPositionOccupied(session: InGameSession, x: number, y: number): boolean {
        return Boolean(this.gameCache.getTileOccupant(session.id, x, y));
    }
}
