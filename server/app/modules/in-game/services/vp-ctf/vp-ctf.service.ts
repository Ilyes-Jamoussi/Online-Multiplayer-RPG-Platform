import { RETURN_FLAG_SEARCH_RADIUS } from '@app/constants/virtual-player.constants';
import { PointOfInterestType } from '@app/enums/point-of-interest-type.enum';
import { VPConfig } from '@app/interfaces/vp-config.interface';
import { EvaluatedTarget, MapScanWithDistances, PointOfInterestWithPath } from '@app/interfaces/vp-gameplay.interface';
import { PathResult } from '@app/interfaces/vp-pathfinding.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { VPPathfindingService } from '@app/modules/in-game/services/vp-pathfinding/vp-pathfinding.service';
import { Orientation } from '@common/enums/orientation.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VPCTFService {
    constructor(
        private readonly pathfindingService: VPPathfindingService,
        private readonly gameCache: GameCacheService,
    ) {}

    evaluateCTFObjectives(
        session: InGameSession,
        vpPlayerId: string,
        pointsWithDistances: MapScanWithDistances,
        results: EvaluatedTarget[],
        config: VPConfig,
    ): boolean {
        const flagData = session.flagData;
        if (!flagData) return false;

        const vpPlayer = session.inGamePlayers[vpPlayerId];
        if (!vpPlayer) return false;

        const vpHasFlag = flagData.holderPlayerId === vpPlayerId;
        if (vpHasFlag) {
            this.evaluateReturnFlag(session, vpPlayerId, results, config);
            return true;
        }

        if (!flagData.holderPlayerId) {
            this.evaluateDroppedFlag(pointsWithDistances.flags, results, config);
            return true;
        }

        const flagCarrier = session.inGamePlayers[flagData.holderPlayerId];
        if (!flagCarrier) return false;

        const isEnemyCarrier = flagCarrier.teamNumber !== vpPlayer.teamNumber;
        if (!isEnemyCarrier) return false;

        if (config.flag.chaseFlagCarrierPriority) {
            this.evaluateFlagCarrier(session, vpPlayerId, flagCarrier, results, config);
        }

        if (config.flag.guardStartPointPriority) {
            this.evaluateGuardPoint(session, vpPlayerId, flagCarrier, results, config);
        }

        return true;
    }

    private evaluateReturnFlag(session: InGameSession, vpPlayerId: string, results: EvaluatedTarget[], config: VPConfig): void {
        const vpPlayer = session.inGamePlayers[vpPlayerId];
        if (!vpPlayer) return;

        const startPoint = session.startPoints.find((sp) => sp.playerId === vpPlayerId);
        if (!startPoint) return;

        const returnPosition: Position = { x: startPoint.x, y: startPoint.y };

        const blockingEnemy = this.findEnemyBlockingDirectPath(session, vpPlayerId, returnPosition);
        if (blockingEnemy) {
            this.evaluateBlockingEnemyAttack(session, vpPlayerId, blockingEnemy, results, config);
            return;
        }

        let path = this.pathfindingService.findPath(session, vpPlayerId, returnPosition);

        if (!path.reachable) {
            path = this.findBestPathToAdjacent(session, vpPlayerId, returnPosition);
        }

        if (!path.reachable) {
            path = this.findClosestReachableTowards(session, vpPlayerId, returnPosition);
        }

        if (!path.reachable || !path.actions.length) {
            this.evaluateAdjacentEnemiesForBlockedFlagCarrier(session, vpPlayerId, results, config);
            return;
        }

        const returnFlagPriority = 200;
        const score = returnFlagPriority - path.totalCost * config.distanceWeights.flagPenaltyPerTile;
        results.push({ type: PointOfInterestType.RETURNFLAG, position: path.destination, path, priorityScore: Math.max(1, score) });
    }

    private findEnemyBlockingDirectPath(
        session: InGameSession,
        vpPlayerId: string,
        targetPosition: Position,
    ): { id: string; position: Position } | null {
        const vpPlayer = session.inGamePlayers[vpPlayerId];
        if (!vpPlayer) return null;

        const vpPosition: Position = { x: vpPlayer.x, y: vpPlayer.y };
        const directDirections = this.getDirectDirectionsToTarget(vpPosition, targetPosition);

        for (const orientation of directDirections) {
            const adjacentPos = this.getNextPositionFromOrientation(vpPosition, orientation);
            const occupantId = this.gameCache.getTileOccupant(session.id, adjacentPos);
            if (!occupantId || occupantId === vpPlayerId) continue;

            const occupant = session.inGamePlayers[occupantId];
            if (!occupant || !occupant.health) continue;
            if (occupant.teamNumber === vpPlayer.teamNumber) continue;

            return { id: occupantId, position: adjacentPos };
        }

        return null;
    }

    private getDirectDirectionsToTarget(from: Position, to: Position): Orientation[] {
        const directions: Orientation[] = [];
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        if (dx > 0) directions.push(Orientation.E);
        if (dx < 0) directions.push(Orientation.W);
        if (dy > 0) directions.push(Orientation.S);
        if (dy < 0) directions.push(Orientation.N);

        return directions;
    }

    private getNextPositionFromOrientation(currentPos: Position, orientation: Orientation): Position {
        switch (orientation) {
            case Orientation.N:
                return { x: currentPos.x, y: currentPos.y - 1 };
            case Orientation.E:
                return { x: currentPos.x + 1, y: currentPos.y };
            case Orientation.S:
                return { x: currentPos.x, y: currentPos.y + 1 };
            case Orientation.W:
                return { x: currentPos.x - 1, y: currentPos.y };
            default:
                return currentPos;
        }
    }

    private evaluateBlockingEnemyAttack(
        session: InGameSession,
        vpPlayerId: string,
        blockingEnemy: { id: string; position: Position },
        results: EvaluatedTarget[],
        config: VPConfig,
    ): void {
        const vpPlayer = session.inGamePlayers[vpPlayerId];
        if (!vpPlayer) return;

        const blockedFlagCarrierAttackPriority = 180;
        const score = blockedFlagCarrierAttackPriority + config.bonuses.adjacentAttackBonus;

        results.push({
            type: PointOfInterestType.ENEMY,
            position: blockingEnemy.position,
            playerId: blockingEnemy.id,
            path: {
                reachable: true,
                totalCost: 0,
                actionsRequired: 0,
                actions: [],
                destination: { x: vpPlayer.x, y: vpPlayer.y },
            },
            priorityScore: score,
        });
    }

    private evaluateAdjacentEnemiesForBlockedFlagCarrier(
        session: InGameSession,
        vpPlayerId: string,
        results: EvaluatedTarget[],
        config: VPConfig,
    ): void {
        const vpPlayer = session.inGamePlayers[vpPlayerId];
        if (!vpPlayer) return;

        const vpPosition: Position = { x: vpPlayer.x, y: vpPlayer.y };
        const adjacentPositions = this.getAdjacentPositions(vpPosition);

        for (const adjPos of adjacentPositions) {
            const occupantId = this.gameCache.getTileOccupant(session.id, adjPos);
            if (!occupantId || occupantId === vpPlayerId) continue;

            const occupant = session.inGamePlayers[occupantId];
            if (!occupant || !occupant.health) continue;
            if (occupant.teamNumber === vpPlayer.teamNumber) continue;

            const blockedFlagCarrierAttackPriority = 180;
            const score = blockedFlagCarrierAttackPriority + config.bonuses.adjacentAttackBonus;

            results.push({
                type: PointOfInterestType.ENEMY,
                position: adjPos,
                playerId: occupantId,
                path: {
                    reachable: true,
                    totalCost: 0,
                    actionsRequired: 0,
                    actions: [],
                    destination: vpPosition,
                },
                priorityScore: score,
            });
        }
    }

    private findClosestReachableTowards(session: InGameSession, vpPlayerId: string, target: Position): PathResult {
        const player = session.inGamePlayers[vpPlayerId];
        if (!player) return this.createUnreachableResult(target);

        const playerPos: Position = { x: player.x, y: player.y };
        let bestPath: PathResult | null = null;
        let bestDistanceToTarget = Infinity;

        for (let dx = -RETURN_FLAG_SEARCH_RADIUS; dx <= RETURN_FLAG_SEARCH_RADIUS; dx++) {
            for (let dy = -RETURN_FLAG_SEARCH_RADIUS; dy <= RETURN_FLAG_SEARCH_RADIUS; dy++) {
                if (dx === 0 && dy === 0) continue;
                const pos: Position = { x: playerPos.x + dx, y: playerPos.y + dy };
                const path = this.pathfindingService.findPath(session, vpPlayerId, pos);
                if (!path.reachable || !path.actions.length) continue;

                const distToTarget = Math.abs(pos.x - target.x) + Math.abs(pos.y - target.y);
                const currentDist = Math.abs(playerPos.x - target.x) + Math.abs(playerPos.y - target.y);

                if (distToTarget < currentDist && distToTarget < bestDistanceToTarget) {
                    bestDistanceToTarget = distToTarget;
                    bestPath = path;
                }
            }
        }

        return bestPath || this.createUnreachableResult(target);
    }

    private evaluateDroppedFlag(flags: PointOfInterestWithPath[], results: EvaluatedTarget[], config: VPConfig): void {
        for (const flag of flags) {
            if (!flag.path.reachable || flag.isHeld) continue;
            const distance = flag.path.totalCost;
            if (distance > config.maxDistances.maxFlagDistance) continue;
            const score = config.priorities.flag - distance * config.distanceWeights.flagPenaltyPerTile;
            results.push({ ...flag, priorityScore: Math.max(0, score) });
        }
    }

    private evaluateFlagCarrier(session: InGameSession, vpPlayerId: string, flagCarrier: Player, results: EvaluatedTarget[], config: VPConfig): void {
        const carrierPosition: Position = { x: flagCarrier.x, y: flagCarrier.y };
        const path = this.findBestPathToAdjacent(session, vpPlayerId, carrierPosition);
        if (!path.reachable) return;

        const distance = path.totalCost;
        if (distance > config.flag.maxChaseFlagCarrierDistance) return;

        const score =
            config.flag.chaseFlagCarrierPriority - distance * config.flag.chaseFlagCarrierPenaltyPerTile + config.flag.chaseFlagCarrierBonus;
        results.push({
            type: PointOfInterestType.FLAGCARRIER,
            position: carrierPosition,
            playerId: flagCarrier.id,
            path,
            priorityScore: Math.max(0, score),
        });
    }

    private evaluateGuardPoint(session: InGameSession, vpPlayerId: string, flagCarrier: Player, results: EvaluatedTarget[], config: VPConfig): void {
        const startPoint = session.startPoints.find((sp) => sp.playerId === flagCarrier.id);
        if (!startPoint) return;

        const guardPosition: Position = { x: startPoint.x, y: startPoint.y };
        let path = this.pathfindingService.findPath(session, vpPlayerId, guardPosition);
        if (!path.reachable) path = this.findBestPathToAdjacent(session, vpPlayerId, guardPosition);
        if (!path.reachable) return;

        const distance = path.totalCost;
        if (distance > config.flag.maxGuardStartPointDistance) return;

        const score = config.flag.guardStartPointPriority - distance * config.flag.guardStartPointPenaltyPerTile + config.flag.guardStartPointBonus;
        results.push({ type: PointOfInterestType.GUARDPOINT, position: guardPosition, path, priorityScore: Math.max(0, score) });
    }

    private findBestPathToAdjacent(session: InGameSession, vpPlayerId: string, targetPosition: Position): PathResult {
        const player = session.inGamePlayers[vpPlayerId];
        if (!player) {
            return this.createUnreachableResult(targetPosition);
        }

        if (this.isAdjacent({ x: player.x, y: player.y }, targetPosition)) {
            return {
                reachable: true,
                totalCost: 0,
                actionsRequired: 0,
                actions: [],
                destination: { x: player.x, y: player.y },
            };
        }

        const adjacentPositions = this.getAdjacentPositions(targetPosition);
        let bestPath: PathResult | null = null;

        for (const adjPos of adjacentPositions) {
            if (!this.isValidAdjacentPosition(session, adjPos, vpPlayerId)) continue;

            const path = this.pathfindingService.findPath(session, vpPlayerId, adjPos);

            if (path.reachable) {
                if (!bestPath || path.totalCost < bestPath.totalCost) {
                    bestPath = path;
                }
            }
        }

        return bestPath || this.createUnreachableResult(targetPosition);
    }

    private getAdjacentPositions(position: Position): Position[] {
        return [
            { x: position.x, y: position.y - 1 },
            { x: position.x + 1, y: position.y },
            { x: position.x, y: position.y + 1 },
            { x: position.x - 1, y: position.y },
        ];
    }

    private isAdjacent(pos1: Position, pos2: Position): boolean {
        const dx = Math.abs(pos1.x - pos2.x);
        const dy = Math.abs(pos1.y - pos2.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    private isValidAdjacentPosition(session: InGameSession, position: Position, vpPlayerId: string): boolean {
        const mapSize = this.gameCache.getMapSize(session.id);

        if (position.x < 0 || position.x >= mapSize || position.y < 0 || position.y >= mapSize) {
            return false;
        }

        const tile = this.gameCache.getTileAtPosition(session.id, position);
        if (!tile || tile.kind === TileKind.WALL || tile.kind === TileKind.WATER) return false;

        const occupant = this.gameCache.getTileOccupant(session.id, position);
        if (occupant && occupant !== vpPlayerId) return false;

        return true;
    }

    private createUnreachableResult(targetPosition: Position): PathResult {
        return {
            reachable: false,
            totalCost: Infinity,
            actionsRequired: 0,
            actions: [],
            destination: targetPosition,
        };
    }
}
