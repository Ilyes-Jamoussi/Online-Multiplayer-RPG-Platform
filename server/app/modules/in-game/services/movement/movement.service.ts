import { ServerEvents } from '@app/enums/server-events.enum';
import { MoveData } from '@app/interfaces/move-data.interface';
import { ReachableTileExplorationContext } from '@app/interfaces/reachable-tile-exploration-context.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { GameMode } from '@common/enums/game-mode.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind, PlaceableReachable } from '@common/enums/placeable-kind.enum';
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
        const player = this.validatePlayer(session, playerId);
        const nextPosition = this.calculateNextPosition(session, player, orientation);
        const moveData = this.validateAndPrepareMove(session, player, nextPosition);
        const finalPosition = this.handleTeleportation(session, moveData);
        this.executeMove(session, playerId, player, moveData, finalPosition);
        this.handleCTFMove(session, playerId, finalPosition);
        return player.speed;
    }

    private validatePlayer(session: InGameSession, playerId: string): Player {
        const player = session.inGamePlayers[playerId];
        if (!player) {
            throw new NotFoundException('Player not found');
        }
        return player;
    }

    private calculateNextPosition(session: InGameSession, player: Player, orientation: Orientation): Position {
        return this.gameCache.getNextPosition(session.id, { x: player.x, y: player.y }, orientation);
    }

    private validateAndPrepareMove(session: InGameSession, player: Player, nextPosition: Position): MoveData {
        const tile = this.gameCache.getTileAtPosition(session.id, nextPosition);
        if (!tile) {
            throw new NotFoundException('Tile not found');
        }

        const placeable = this.gameCache.getPlaceableAtPosition(session.id, nextPosition);
        if (placeable) {
            const isPlaceableReachable = Boolean(PlaceableReachable[placeable.kind]);
            if (!isPlaceableReachable) {
                throw new BadRequestException('Cannot move onto this placeable');
            }
        }

        const isOnBoat = Boolean(player.onBoatId);
        if (isOnBoat && tile.kind === TileKind.TELEPORT) {
            throw new BadRequestException('Cannot use teleporter while on a boat');
        }

        const moveCost = this.calculateTileCost(session.id, nextPosition, isOnBoat);
        if (moveCost === null) {
            throw new BadRequestException('Cannot move onto this tile');
        }
        if (moveCost > player.speed + player.boatSpeed) {
            throw new BadRequestException('Not enough movement points for this tile');
        }

        return {
            nextPosition,
            tile,
            moveCost,
            isOnBoat,
            originX: player.x,
            originY: player.y,
        };
    }

    private handleTeleportation(session: InGameSession, moveData: MoveData): Position {
        if (moveData.tile.kind !== TileKind.TELEPORT) {
            return moveData.nextPosition;
        }

        const destination = this.gameCache.getTeleportDestination(session.id, moveData.nextPosition);
        const destinationOccupant = this.gameCache.getTileOccupant(session.id, destination);
        return destinationOccupant ? moveData.nextPosition : destination;
    }

    private executeMove(session: InGameSession, playerId: string, player: Player, moveData: MoveData, finalPosition: Position): void {
        if (this.gameCache.getTileOccupant(session.id, finalPosition)) {
            throw new BadRequestException('Tile is occupied');
        }

        if (player.onBoatId) {
            this.gameCache.updatePlaceablePosition(session.id, { x: player.x, y: player.y }, finalPosition);
        }

        this.sessionRepository.movePlayerPosition(session.id, playerId, finalPosition.x, finalPosition.y, moveData.moveCost);

        const teleported =
            moveData.tile.kind === TileKind.TELEPORT && (finalPosition.x !== moveData.nextPosition.x || finalPosition.y !== moveData.nextPosition.y);
        if (teleported) {
            this.eventEmitter.emit(ServerEvents.Teleported, {
                session,
                playerId,
                originX: moveData.originX,
                originY: moveData.originY,
                destinationX: finalPosition.x,
                destinationY: finalPosition.y,
            });
        }

        this.calculateReachableTiles(session, playerId);
    }

    private handleCTFMove(session: InGameSession, playerId: string, position: Position): void {
        if (session.mode !== GameMode.CTF) return;

        if (this.sessionRepository.playerHasFlag(session.id, playerId)) {
            this.sessionRepository.updateFlagPosition(session, playerId, position);
            this.checkCTFVictory(session, playerId, position);
        } else {
            this.tryPickUpFlag(session, playerId, position);
        }
    }

    private tryPickUpFlag(session: InGameSession, playerId: string, position: Position): void {
        const placeables = this.gameCache.getPlaceablesAtPosition(session.id, position);
        for (const object of placeables) {
            if (object.kind === PlaceableKind.FLAG && object.placed) {
                this.sessionRepository.pickUpFlag(session, playerId);
            }
        }
    }

    checkCTFVictory(session: InGameSession, playerId: string, position: Position): void {
        const player = session.inGamePlayers[playerId];
        if (!player) return;

        const startPoint = this.sessionRepository.findStartPointById(session.id, player.startPointId);
        if (!startPoint) return;

        if (startPoint.x === position.x && startPoint.y === position.y && this.sessionRepository.playerHasFlag(session.id, playerId)) {
            this.eventEmitter.emit(ServerEvents.GameOver, {
                sessionId: session.id,
                winnerId: playerId,
                winnerName: player.name,
            });
        }
    }

    movePlayerToStartPosition(session: InGameSession, playerId: string): void {
        const player = session.inGamePlayers[playerId];
        if (!player) {
            throw new NotFoundException('Player not found');
        }
        this.disembarkBoat(session, playerId, { x: player.x, y: player.y });
        const startPointId = player.startPointId;
        const startPoint = this.sessionRepository.findStartPointById(session.id, startPointId);
        if (!startPoint) {
            throw new NotFoundException('Start point not found');
        }
        if (!(startPoint.x === player.x && startPoint.y === player.y)) {
            const nextPosition = this.findClosestFreeTile(session, { x: startPoint.x, y: startPoint.y });
            player.health = player.maxHealth;
            this.sessionRepository.movePlayerPosition(session.id, playerId, nextPosition.x, nextPosition.y, 0);
        }
        this.calculateReachableTiles(session, session.currentTurn.activePlayerId);
    }

    disembarkBoat(session: InGameSession, playerId: string, position: Position): void {
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.onBoatId = undefined;
        if (position.x !== player.x || position.y !== player.y) {
            this.sessionRepository.movePlayerPosition(session.id, playerId, position.x, position.y, 0);
        }
        this.sessionRepository.resetPlayerBoatSpeedBonus(session.id, playerId);
        this.handleCTFMove(session, playerId, position);
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

        const placeable = this.gameCache.getPlaceableAtPosition(sessionId, { x: current.x, y: current.y });
        const isStartPosition = current.x === startPosition.x && current.y === startPosition.y;
        const isPlaceableReachable = placeable ? Boolean(PlaceableReachable[placeable.kind]) : true;

        if (!isPlaceableReachable && !isStartPosition) {
            return false;
        }

        if (isPlaceableReachable || isStartPosition) {
            reachable.push(current);
        }

        return true;
    }

    private exploreNeighbors(current: ReachableTile, context: ReachableTileExplorationContext): void {
        const directions = this.getAdjacentPositions(current);

        for (const next of directions) {
            if (this.shouldSkipPosition(next, context.visited, context.mapSize)) continue;

            const tileCost = this.calculateTileCost(context.session.id, next, context.isOnBoat);
            if (tileCost === null) continue;

            if (this.isPositionOccupied(context.session, next)) continue;

            const tile = this.gameCache.getTileAtPosition(context.session.id, next);
            if (tile?.kind === TileKind.TELEPORT) {
                if (this.isTeleportDestinationOccupied(context.session.id, next)) {
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

    private isTeleportDestinationOccupied(sessionId: string, teleportPosition: Position): boolean {
        try {
            const destination = this.gameCache.getTeleportDestination(sessionId, teleportPosition);
            return this.gameCache.getTileOccupant(sessionId, destination) !== null;
        } catch {
            return true;
        }
    }

    private addTeleportDestination(teleportTile: ReachableTile, context: ReachableTileExplorationContext): void {
        try {
            const destination = this.gameCache.getTeleportDestination(context.session.id, { x: teleportTile.x, y: teleportTile.y });
            const destinationKey = `${destination.x},${destination.y}`;

            if (context.visited.has(destinationKey)) return;
            if (this.isPositionOccupied(context.session, destination)) return;

            const destinationTileCost = this.calculateTileCost(context.session.id, destination, context.isOnBoat);
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

    private calculateTileCost(sessionId: string, position: Position, isOnBoat: boolean): number | null {
        const tile = this.gameCache.getTileAtPosition(sessionId, position);
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

    private isPositionOccupied(session: InGameSession, position: Position): boolean {
        return Boolean(this.gameCache.getTileOccupant(session.id, position));
    }

    private findClosestFreeTile(session: InGameSession, position: Position): Position {
        const mapSize = this.gameCache.getMapSize(session.id);

        if (this.gameCache.isTileFree(session.id, position)) {
            return position;
        }

        const visited = new Set<string>();
        const queue: PositionWithDistance[] = [{ ...position, distance: 0 }];
        visited.add(`${position.x},${position.y}`);

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
                if (this.gameCache.isTileFree(session.id, neighbor)) {
                    return neighbor;
                }

                queue.push({ x: neighbor.x, y: neighbor.y, distance: current.distance + 1 });
            }
        }

        throw new NotFoundException('No free tile found near start point');
    }
}
