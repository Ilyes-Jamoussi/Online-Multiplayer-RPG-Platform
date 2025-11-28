import { ExplorationContext, NeighborParams, PathNode, TileExploration } from '@app/interfaces/vp-pathfinding-internal.interface';
import { EnemyPosition, EscapePoint, PathAction, PathResult } from '@app/interfaces/vp-pathfinding.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileCost, TileKind } from '@common/enums/tile.enum';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable } from '@nestjs/common';


const DIRECTIONS: { orientation: Orientation; dx: number; dy: number }[] = [
    { orientation: Orientation.N, dx: 0, dy: -1 },
    { orientation: Orientation.E, dx: 1, dy: 0 },
    { orientation: Orientation.S, dx: 0, dy: 1 },
    { orientation: Orientation.W, dx: -1, dy: 0 },
];

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

        while (openSet.length > 0) {
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

        for (const dir of DIRECTIONS) {
            const nextPos: Position = { x: current.position.x + dir.dx, y: current.position.y + dir.dy };

            if (!this.isValidPosition(nextPos, context.mapSize)) continue;

            const tile = this.gameCache.getTileAtPosition(context.session.id, nextPos);
            if (!tile || tile.kind === TileKind.WALL) continue;

            const occupant = this.gameCache.getTileOccupant(context.session.id, nextPos);
            if (occupant && !(nextPos.x === context.goal.x && nextPos.y === context.goal.y)) continue;

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
                this.createNeighborNode({ current, position: nextPos, moveCost: 1, orientation, actionType: 'move', isOnBoat: true, goal }),
            );
        }

        if (tile.kind === TileKind.BASE || (tile.kind === TileKind.DOOR && tile.open)) {
            neighbors.push(
                this.createNeighborNode({
                    current,
                    position: nextPos,
                    moveCost: 0,
                    orientation,
                    actionType: 'disembarkBoat',
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
                        actionType: 'move',
                        isOnBoat: false,
                        goal,
                    }),
                );
            }
        }

        this.addBoatBoardingOption(neighbors, exp, session);
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
                    actionType: 'move',
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
                    actionType: 'openDoor',
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
                actionToReach: { type: 'teleport', orientation, position: nextPos },
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
                    actionType: 'boardBoat',
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
            if (action.type === 'openDoor') {
                expandedActions.push({
                    type: 'openDoor',
                    orientation: action.orientation,
                    position: action.position,
                });
                expandedActions.push({
                    type: 'move',
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
        let bestEscape: EscapePoint | null = null;

        const samplePositions = this.getSampleEscapePositions(mapSize);

        for (const pos of samplePositions) {
            const path = this.findPath(session, vpPlayerId, pos);
            if (!path.reachable) continue;

            const minDistanceFromEnemies = this.calculateMinDistanceFromEnemies(pos, enemies);

            if (!bestEscape || minDistanceFromEnemies > bestEscape.distanceFromEnemies) {
                bestEscape = { position: pos, path, distanceFromEnemies: minDistanceFromEnemies };
            }
        }

        return bestEscape;
    }

    private getSampleEscapePositions(mapSize: number): Position[] {
        const positions: Position[] = [];
        const margin = 1;
        const gridDivisor = 5;
        const minStep = 2;
        const step = Math.max(minStep, Math.floor(mapSize / gridDivisor));

        // Corners
        positions.push({ x: margin, y: margin });
        positions.push({ x: mapSize - 1 - margin, y: margin });
        positions.push({ x: margin, y: mapSize - 1 - margin });
        positions.push({ x: mapSize - 1 - margin, y: mapSize - 1 - margin });

        // Edges midpoints
        const midPoint = Math.floor(mapSize / 2);
        positions.push({ x: midPoint, y: margin });
        positions.push({ x: midPoint, y: mapSize - 1 - margin });
        positions.push({ x: margin, y: midPoint });
        positions.push({ x: mapSize - 1 - margin, y: midPoint });

        // Grid sample
        for (let x = margin; x < mapSize - margin; x += step) {
            for (let y = margin; y < mapSize - margin; y += step) {
                positions.push({ x, y });
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
