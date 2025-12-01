import { ESCAPE_MAX_DISTANCE, ESCAPE_NEARBY_RADIUS, VP_DIRECTIONS } from '@app/constants/virtual-player.constants';
import { PathActionType } from '@app/enums/path-action-type.enum';
import { ExplorationContext, NeighborParams, PathNode, TileExploration } from '@app/interfaces/vp-pathfinding-internal.interface';
import { EnemyPosition, EscapePoint, PathAction, PathResult } from '@app/interfaces/vp-pathfinding.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileCost, TileKind } from '@common/enums/tile.enum';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VPPathfindingService {
    constructor(private readonly gameCache: GameCacheService) {}

    findPath(session: InGameSession, vpPlayerId: string, destination: Position): PathResult {
        const player = session.inGamePlayers[vpPlayerId];
        if (!player) {
            return this.createEmptyResult(destination);
        }

        const start: Position = { x: player.x, y: player.y };
        const isOnBoat = Boolean(player.onBoatId);

        if (start.x === destination.x && start.y === destination.y) {
            return { reachable: true, totalCost: 0, actionsRequired: 0, actions: [], destination };
        }

        return this.aStarPathfinding(session, start, destination, isOnBoat);
    }

    private aStarPathfinding(session: InGameSession, start: Position, goal: Position, startOnBoat: boolean): PathResult {
        const openSet: PathNode[] = [];
        const closedSet = new Map<string, PathNode>();
        const mapSize = this.gameCache.getMapSize(session.id);
        const context: ExplorationContext = { session, mapSize, goal };

        const startNode: PathNode = {
            position: start,
            costFromStart: 0,
            estimatedCostToGoal: this.heuristic(start, goal),
            totalCost: this.heuristic(start, goal),
            parent: null,
            actionToReach: null,
            isOnBoat: startOnBoat,
            actionsUsed: 0,
        };

        openSet.push(startNode);

        while (openSet.length) {
            openSet.sort((a, b) => a.totalCost - b.totalCost);
            const current = openSet.shift();
            if (!current) continue;

            if (current.position.x === goal.x && current.position.y === goal.y) {
                return this.reconstructPath(current, goal);
            }

            const currentKey = this.getNodeKey(current.position, current.isOnBoat);
            closedSet.set(currentKey, current);

            const neighbors = this.getNeighbors(current, context);
            for (const neighbor of neighbors) {
                const neighborKey = this.getNodeKey(neighbor.position, neighbor.isOnBoat);
                if (closedSet.has(neighborKey)) continue;

                const existingNode = openSet.find(
                    (n) => n.position.x === neighbor.position.x && n.position.y === neighbor.position.y && n.isOnBoat === neighbor.isOnBoat,
                );

                if (!existingNode) {
                    openSet.push(neighbor);
                } else if (neighbor.costFromStart < existingNode.costFromStart) {
                    existingNode.costFromStart = neighbor.costFromStart;
                    existingNode.totalCost = neighbor.totalCost;
                    existingNode.parent = neighbor.parent;
                    existingNode.actionToReach = neighbor.actionToReach;
                    existingNode.actionsUsed = neighbor.actionsUsed;
                }
            }
        }

        return this.createEmptyResult(goal);
    }

    private getNeighbors(current: PathNode, context: ExplorationContext): PathNode[] {
        const neighbors: PathNode[] = [];

        for (const dir of VP_DIRECTIONS) {
            const nextPos: Position = { x: current.position.x + dir.dx, y: current.position.y + dir.dy };

            if (!this.isValidPosition(nextPos, context.mapSize)) continue;

            const tile = this.gameCache.getTileAtPosition(context.session.id, nextPos);
            if (!tile || tile.kind === TileKind.WALL) continue;

            const occupant = this.gameCache.getTileOccupant(context.session.id, nextPos);
            if (occupant && !(nextPos.x === context.goal.x && nextPos.y === context.goal.y)) continue;

            if (this.hasBlockingPlaceable(context.session.id, nextPos)) continue;

            const exploration: TileExploration = { current, nextPos, tile, orientation: dir.orientation, goal: context.goal };

            if (current.isOnBoat) {
                this.addBoatNeighbors(neighbors, exploration);
            } else {
                this.addWalkingNeighbors(neighbors, exploration, context.session);
            }
        }

        return neighbors;
    }

    private addBoatNeighbors(neighbors: PathNode[], exp: TileExploration): void {
        const { current, nextPos, tile, orientation, goal } = exp;

        if (tile.kind === TileKind.WATER) {
            neighbors.push(
                this.createNeighborNode({
                    current,
                    position: nextPos,
                    moveCost: 1,
                    orientation,
                    actionType: PathActionType.MOVE,
                    isOnBoat: true,
                    goal,
                }),
            );
        }

        if (tile.kind === TileKind.BASE || (tile.kind === TileKind.DOOR && tile.open)) {
            neighbors.push(
                this.createNeighborNode({
                    current,
                    position: nextPos,
                    moveCost: 0,
                    orientation,
                    actionType: PathActionType.DISEMBARK_BOAT,
                    isOnBoat: false,
                    goal,
                    extraActions: 1,
                }),
            );
        }
    }

    private addWalkingNeighbors(neighbors: PathNode[], exp: TileExploration, session: InGameSession): void {
        const { current, nextPos, tile, orientation, goal } = exp;

        if (tile.kind === TileKind.DOOR) {
            this.addDoorNeighbor(neighbors, exp);
        } else if (tile.kind === TileKind.TELEPORT) {
            this.addTeleportNeighbor(neighbors, exp, session);
        } else {
            const tileCost = this.getTileCost(tile.kind);
            if (tileCost !== null) {
                neighbors.push(
                    this.createNeighborNode({
                        current,
                        position: nextPos,
                        moveCost: tileCost,
                        orientation,
                        actionType: PathActionType.MOVE,
                        isOnBoat: false,
                        goal,
                    }),
                );
            }
        }

        if (tile.kind === TileKind.WATER) {
            this.addBoatBoardingOption(neighbors, exp, session);
        }
    }

    private addDoorNeighbor(neighbors: PathNode[], exp: TileExploration): void {
        const { current, nextPos, tile, orientation, goal } = exp;

        if (tile.open) {
            neighbors.push(
                this.createNeighborNode({
                    current,
                    position: nextPos,
                    moveCost: TileCost.DOOR_OPEN,
                    orientation,
                    actionType: PathActionType.MOVE,
                    isOnBoat: false,
                    goal,
                }),
            );
        } else {
            neighbors.push(
                this.createNeighborNode({
                    current,
                    position: nextPos,
                    moveCost: TileCost.DOOR_OPEN,
                    orientation,
                    actionType: PathActionType.OPEN_DOOR,
                    isOnBoat: false,
                    goal,
                    extraActions: 1,
                }),
            );
        }
    }

    private addTeleportNeighbor(neighbors: PathNode[], exp: TileExploration, session: InGameSession): void {
        const { current, nextPos, tile, orientation, goal } = exp;

        const tileCost = this.getTileCost(tile.kind);
        if (tileCost === null) return;

        try {
            const destination = this.gameCache.getTeleportDestination(session.id, nextPos);
            const destinationOccupant = this.gameCache.getTileOccupant(session.id, destination);

            if (destinationOccupant && !(destination.x === goal.x && destination.y === goal.y)) {
                return;
            }

            const costFromStart = current.costFromStart + tileCost;
            const estimatedCostToGoal = this.heuristic(destination, goal);

            neighbors.push({
                position: destination,
                costFromStart,
                estimatedCostToGoal,
                totalCost: costFromStart + estimatedCostToGoal,
                parent: current,
                actionToReach: { type: PathActionType.TELEPORT, orientation, position: nextPos },
                isOnBoat: false,
                actionsUsed: current.actionsUsed,
            });
        } catch {
            return;
        }
    }

    private addBoatBoardingOption(neighbors: PathNode[], exp: TileExploration, session: InGameSession): void {
        const { current, nextPos, tile, orientation, goal } = exp;

        if (tile.kind !== TileKind.WATER) return;

        const placeable = this.gameCache.getPlaceableAtPosition(session.id, nextPos);
        if (placeable && placeable.kind === PlaceableKind.BOAT) {
            neighbors.push(
                this.createNeighborNode({
                    current,
                    position: nextPos,
                    moveCost: 1,
                    orientation,
                    actionType: PathActionType.BOARD_BOAT,
                    isOnBoat: true,
                    goal,
                    extraActions: 1,
                }),
            );
        }
    }

    private createNeighborNode(params: NeighborParams): PathNode {
        const costFromStart = params.current.costFromStart + params.moveCost;
        const estimatedCostToGoal = this.heuristic(params.position, params.goal);

        return {
            position: params.position,
            costFromStart,
            estimatedCostToGoal,
            totalCost: costFromStart + estimatedCostToGoal,
            parent: params.current,
            actionToReach: { type: params.actionType, orientation: params.orientation, position: params.position },
            isOnBoat: params.isOnBoat,
            actionsUsed: params.current.actionsUsed + (params.extraActions || 0),
        };
    }

    private isValidPosition(pos: Position, mapSize: number): boolean {
        return pos.x >= 0 && pos.x < mapSize && pos.y >= 0 && pos.y < mapSize;
    }

    private hasBlockingPlaceable(sessionId: string, position: Position): boolean {
        const placeable = this.gameCache.getPlaceableAtPosition(sessionId, position);
        if (!placeable) return false;

        return placeable.kind === PlaceableKind.HEAL || placeable.kind === PlaceableKind.FIGHT;
    }

    private getTileCost(kind: TileKind): number | null {
        switch (kind) {
            case TileKind.BASE:
                return TileCost.BASE;
            case TileKind.ICE:
                return TileCost.ICE;
            case TileKind.WATER:
                return TileCost.WATER;
            case TileKind.TELEPORT:
                return TileCost.TELEPORT;
            default:
                return null;
        }
    }

    private heuristic(a: Position, b: Position): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private getNodeKey(position: Position, isOnBoat: boolean): string {
        return `${position.x},${position.y},${isOnBoat}`;
    }

    private reconstructPath(endNode: PathNode, destination: Position): PathResult {
        const rawActions: PathAction[] = [];
        let current: PathNode | null = endNode;
        const totalActionsRequired = endNode.actionsUsed;

        while (current && current.actionToReach) {
            rawActions.unshift(current.actionToReach);
            current = current.parent;
        }

        const actions = this.expandDoorActions(rawActions);

        return { reachable: true, totalCost: endNode.costFromStart, actionsRequired: totalActionsRequired, actions, destination };
    }

    private expandDoorActions(rawActions: PathAction[]): PathAction[] {
        const expandedActions: PathAction[] = [];

        for (const action of rawActions) {
            if (action.type === PathActionType.OPEN_DOOR) {
                expandedActions.push({
                    type: PathActionType.OPEN_DOOR,
                    orientation: action.orientation,
                    position: action.position,
                });
                expandedActions.push({
                    type: PathActionType.MOVE,
                    orientation: action.orientation,
                    position: action.position,
                });
            } else {
                expandedActions.push(action);
            }
        }

        return expandedActions;
    }

    private createEmptyResult(destination: Position): PathResult {
        return { reachable: false, totalCost: Infinity, actionsRequired: 0, actions: [], destination };
    }

    findBestEscapePoint(session: InGameSession, vpPlayerId: string, enemies: EnemyPosition[]): EscapePoint | null {
        const player = session.inGamePlayers[vpPlayerId];
        if (!player) return null;

        const mapSize = this.gameCache.getMapSize(session.id);
        const playerPos: Position = { x: player.x, y: player.y };
        const currentDist = this.calculateMinDistanceFromEnemies(playerPos, enemies);
        const samplePositions = this.getSampleEscapePositions(mapSize, playerPos, enemies);

        let bestEscape: EscapePoint | null = null;
        let fallbackEscape: EscapePoint | null = null;

        for (const pos of samplePositions) {
            if (pos.x === player.x && pos.y === player.y) continue;
            const path = this.findPath(session, vpPlayerId, pos);
            if (!path.reachable || path.totalCost === 0) continue;

            const dist = this.calculateMinDistanceFromEnemies(pos, enemies);

            if (dist > currentDist && (!bestEscape || dist > bestEscape.distanceFromEnemies)) {
                bestEscape = { position: pos, path, distanceFromEnemies: dist };
            } else if (!bestEscape && dist >= currentDist && (!fallbackEscape || dist > fallbackEscape.distanceFromEnemies)) {
                fallbackEscape = { position: pos, path, distanceFromEnemies: dist };
            }
        }
        return bestEscape || fallbackEscape;
    }

    private getSampleEscapePositions(mapSize: number, playerPos: Position, enemies: EnemyPosition[]): Position[] {
        const positions: Position[] = [];
        const avgX = enemies.reduce((sum, e) => sum + e.position.x, 0) / enemies.length;
        const avgY = enemies.reduce((sum, e) => sum + e.position.y, 0) / enemies.length;
        const mag = Math.sqrt((playerPos.x - avgX) ** 2 + (playerPos.y - avgY) ** 2) || 1;
        const nX = (playerPos.x - avgX) / mag;
        const nY = (playerPos.y - avgY) / mag;

        const add = (x: number, y: number) => {
            if (x >= 1 && x < mapSize - 1 && y >= 1 && y < mapSize - 1) positions.push({ x, y });
        };

        for (let d = 1; d <= ESCAPE_MAX_DISTANCE; d++) {
            add(Math.round(playerPos.x + nX * d), Math.round(playerPos.y + nY * d));
            add(Math.round(playerPos.x - nY * d), Math.round(playerPos.y + nX * d));
            add(Math.round(playerPos.x + nY * d), Math.round(playerPos.y - nX * d));
        }
        for (let dx = -ESCAPE_NEARBY_RADIUS; dx <= ESCAPE_NEARBY_RADIUS; dx++) {
            for (let dy = -ESCAPE_NEARBY_RADIUS; dy <= ESCAPE_NEARBY_RADIUS; dy++) {
                if (dx !== 0 || dy !== 0) add(playerPos.x + dx, playerPos.y + dy);
            }
        }
        return positions;
    }

    private calculateMinDistanceFromEnemies(position: Position, enemies: EnemyPosition[]): number {
        let minDistance = Infinity;

        for (const enemy of enemies) {
            const manhattanDistance = Math.abs(position.x - enemy.position.x) + Math.abs(position.y - enemy.position.y);
            if (manhattanDistance < minDistance) {
                minDistance = manhattanDistance;
            }
        }

        return minDistance;
    }
}
