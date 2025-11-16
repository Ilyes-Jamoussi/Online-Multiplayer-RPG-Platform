import { ServerEvents } from '@app/enums/server-events.enum';
import { ReachableTileExplorationContext } from '@app/interfaces/reachable-tile-exploration-context.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileCost, TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position, PositionWithDistance } from '@common/interfaces/position.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MovementService {
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

        let nextX = player.x;
        let nextY = player.y;

        const { x, y } = this.gameCache.getNextPosition(session.id, player.x, player.y, orientation);
        nextX = x;
        nextY = y;
        const tile = this.gameCache.getTileAtPosition(session.id, nextX, nextY);
        if (!tile) {
            throw new NotFoundException('Tile not found');
        }

        const isOnBoat = Boolean(player.onBoatId);
        if (isOnBoat && tile.kind === TileKind.TELEPORT) {
            throw new BadRequestException('Cannot use teleporter while on a boat');
        }

        const moveCost = this.calculateTileCost(session.id, nextX, nextY, isOnBoat);

        if (moveCost === null) {
            throw new BadRequestException('Cannot move onto this tile');
        } else if (moveCost > player.speed + player.boatSpeed) {
            throw new BadRequestException('Not enough movement points for this tile');
        }

        if (tile.kind === TileKind.TELEPORT) {
            const { x: destinationX, y: destinationY } = this.gameCache.getTeleportDestination(session.id, nextX, nextY);
            const destinationOccupant = this.gameCache.getTileOccupant(session.id, destinationX, destinationY);
            nextX = destinationOccupant ? nextX : destinationX;
            nextY = destinationOccupant ? nextY : destinationY;
        }

        if (this.gameCache.getTileOccupant(session.id, nextX, nextY)) {
            throw new BadRequestException('Tile is occupied');
        }

        if (player.onBoatId) {
            this.gameCache.updatePlaceablePosition(session.id, player.x, player.y, nextX, nextY);
        }

        this.sessionRepository.movePlayerPosition(session.id, playerId, nextX, nextY, moveCost);

        this.calculateReachableTiles(session, playerId);

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
        const isOnBoat = Boolean(player.onBoatId);
        const mapSize = this.gameCache.getMapSize(session.id);
        const startPosition: Position = { x: player.x, y: player.y };

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;

            const shouldExplore = this.processCurrentTile(current, visited, reachable, session.id, startPosition);
            if (!shouldExplore) continue;

            const context: ReachableTileExplorationContext = { session, playerId, visited, queue, mapSize, isOnBoat };
            this.exploreNeighbors(current, context);
        }

        this.eventEmitter.emit(ServerEvents.PlayerReachableTiles, { playerId, reachable });
        return reachable;
    }

    private initializeQueue(player: Player): ReachableTile[] {
        return [
            {
                x: player.x,
                y: player.y,
                cost: 0,
                remainingPoints: player.speed + player.boatSpeed,
            },
        ];
    }

    private processCurrentTile(
        current: ReachableTile,
        visited: Set<string>,
        reachable: ReachableTile[],
        sessionId: string,
        startPosition: Position,
    ): boolean {
        const key = `${current.x},${current.y}`;

        if (visited.has(key)) return false;
        visited.add(key);

        const placeable = this.gameCache.getPlaceableAtPosition(sessionId, current.x, current.y);
        const isStartPosition = current.x === startPosition.x && current.y === startPosition.y;
        const hasHealOrFight = placeable && (placeable.kind === PlaceableKind.HEAL || placeable.kind === PlaceableKind.FIGHT);

        if (hasHealOrFight && !isStartPosition) {
            return false;
        }

        if (!hasHealOrFight) {
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

            const tile = this.gameCache.getTileAtPosition(context.session.id, next.x, next.y);
            if (tile?.kind === TileKind.TELEPORT) {
                if (this.isTeleportDestinationOccupied(context.session.id, next.x, next.y)) {
                    continue;
                }
            }

            const newRemainingPoints = current.remainingPoints - tileCost;
            if (newRemainingPoints < 0) continue;

            const nextTile: ReachableTile = {
                x: next.x,
                y: next.y,
                cost: current.cost + tileCost,
                remainingPoints: newRemainingPoints,
            };
            context.queue.push(nextTile);

            if (tile?.kind === TileKind.TELEPORT) {
                this.addTeleportDestination(nextTile, context);
            }
        }
    }

    private isTeleportDestinationOccupied(sessionId: string, teleportX: number, teleportY: number): boolean {
        try {
            const destination = this.gameCache.getTeleportDestination(sessionId, teleportX, teleportY);
            return this.gameCache.getTileOccupant(sessionId, destination.x, destination.y) !== null;
        } catch {
            return true;
        }
    }

    private addTeleportDestination(teleportTile: ReachableTile, context: ReachableTileExplorationContext): void {
        try {
            const destination = this.gameCache.getTeleportDestination(context.session.id, teleportTile.x, teleportTile.y);
            const destinationKey = `${destination.x},${destination.y}`;

            if (context.visited.has(destinationKey)) return;
            if (this.isPositionOccupied(context.session, destination.x, destination.y)) return;

            const destinationTileCost = this.calculateTileCost(context.session.id, destination.x, destination.y, context.isOnBoat);
            if (destinationTileCost === null) return;

            context.queue.push({
                x: destination.x,
                y: destination.y,
                cost: teleportTile.cost,
                remainingPoints: teleportTile.remainingPoints,
            });
        } catch {
            return;
        }
    }

    private getAdjacentPositions(current: ReachableTile): Position[] {
        return [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 },
        ];
    }

    private shouldSkipPosition(next: Position, visited: Set<string>, mapSize: number): boolean {
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

        if (isOnBoat) {
            if (tile.kind === TileKind.WATER) {
                return 1;
            }
            return null;
        }

        let tileCost = TileCost[tile.kind];
        if (tileCost === undefined) return null;

        if (tile.kind === TileKind.DOOR) {
            tileCost = tile.open ? TileCost.DOOR_OPEN : TileCost.DOOR;
        }

        if (tileCost === -1) return null;

        return tileCost;
    }

    private isPositionOccupied(session: InGameSession, x: number, y: number): boolean {
        return Boolean(this.gameCache.getTileOccupant(session.id, x, y));
    }

    private findClosestFreeTile(session: InGameSession, x: number, y: number): Position {
        const mapSize = this.gameCache.getMapSize(session.id);

        if (this.gameCache.isTileFree(session.id, x, y)) {
            return { x, y };
        }

        const visited = new Set<string>();
        const queue: PositionWithDistance[] = [{ x, y, distance: 0 }];
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
