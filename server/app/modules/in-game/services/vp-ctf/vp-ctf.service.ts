import { VPConfig } from '@app/interfaces/vp-config.interface';
import { EvaluatedTarget, MapScanWithDistances, PointOfInterestWithPath } from '@app/interfaces/vp-gameplay.interface';
import { PathResult } from '@app/interfaces/vp-pathfinding.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { VPPathfindingService } from '@app/modules/in-game/services/vp-pathfinding/vp-pathfinding.service';
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

        if (config.flag.chaseFlagCarrierPriority > 0) {
            this.evaluateFlagCarrier(session, vpPlayerId, flagCarrier, results, config);
        }

        if (config.flag.guardStartPointPriority > 0) {
            this.evaluateGuardPoint(session, vpPlayerId, flagCarrier, results, config);
        }

        return true;
    }

    private evaluateReturnFlag(
        session: InGameSession,
        vpPlayerId: string,
        results: EvaluatedTarget[],
        config: VPConfig,
    ): void {
        const vpPlayer = session.inGamePlayers[vpPlayerId];
        if (!vpPlayer) return;

        const startPoint = session.startPoints.find((sp) => sp.playerId === vpPlayerId);
        if (!startPoint) return;

        const returnPosition: Position = { x: startPoint.x, y: startPoint.y };
        const path = this.pathfindingService.findPath(session, vpPlayerId, returnPosition);

        if (!path.reachable) return;

        const distance = path.totalCost;
        const returnFlagPriority = 200;

        let score = returnFlagPriority;
        let reason = `HOLDING FLAG - Return to start point priority: ${score}`;

        const distancePenalty = distance * config.distanceWeights.flagPenaltyPerTile;
        score -= distancePenalty;
        reason += `, Distance penalty: -${distancePenalty.toFixed(1)}`;

        const target: EvaluatedTarget = {
            type: 'returnFlag',
            position: returnPosition,
            path,
            priorityScore: Math.max(0, score),
            reason,
        };

        results.push(target);
    }

    private evaluateDroppedFlag(flags: PointOfInterestWithPath[], results: EvaluatedTarget[], config: VPConfig): void {
        for (const flag of flags) {
            if (!flag.path.reachable) continue;
            if (flag.isHeld) continue;

            const distance = flag.path.totalCost;
            if (distance > config.maxDistances.maxFlagDistance) continue;

            let score = config.priorities.flag;
            let reason = `Base dropped flag priority: ${score}`;

            const distancePenalty = distance * config.distanceWeights.flagPenaltyPerTile;
            score -= distancePenalty;
            reason += `, Distance penalty: -${distancePenalty.toFixed(1)}`;

            results.push({ ...flag, priorityScore: Math.max(0, score), reason });
        }
    }

    private evaluateFlagCarrier(
        session: InGameSession,
        vpPlayerId: string,
        flagCarrier: Player,
        results: EvaluatedTarget[],
        config: VPConfig,
    ): void {
        const carrierPosition: Position = { x: flagCarrier.x, y: flagCarrier.y };
        const path = this.findBestPathToAdjacent(session, vpPlayerId, carrierPosition);

        if (!path.reachable) return;

        const distance = path.totalCost;
        if (distance > config.flag.maxChaseFlagCarrierDistance) return;

        let score = config.flag.chaseFlagCarrierPriority;
        let reason = `Base chase flag carrier priority: ${score}`;

        const distancePenalty = distance * config.flag.chaseFlagCarrierPenaltyPerTile;
        score -= distancePenalty;
        reason += `, Distance penalty: -${distancePenalty.toFixed(1)}`;

        score += config.flag.chaseFlagCarrierBonus;
        reason += `, Chase bonus: +${config.flag.chaseFlagCarrierBonus}`;

        const target: EvaluatedTarget = {
            type: 'flagCarrier',
            position: carrierPosition,
            playerId: flagCarrier.id,
            path,
            priorityScore: Math.max(0, score),
            reason,
        };

        results.push(target);
    }

    private evaluateGuardPoint(
        session: InGameSession,
        vpPlayerId: string,
        flagCarrier: Player,
        results: EvaluatedTarget[],
        config: VPConfig,
    ): void {
        const startPoint = session.startPoints.find((sp) => sp.playerId === flagCarrier.id);
        if (!startPoint) return;

        const guardPosition: Position = { x: startPoint.x, y: startPoint.y };
        let path = this.pathfindingService.findPath(session, vpPlayerId, guardPosition);

        if (!path.reachable) {
            path = this.findBestPathToAdjacent(session, vpPlayerId, guardPosition);
        }

        if (!path.reachable) return;

        const distance = path.totalCost;
        if (distance > config.flag.maxGuardStartPointDistance) return;

        let score = config.flag.guardStartPointPriority;
        let reason = `Base guard start point priority: ${score}`;

        const distancePenalty = distance * config.flag.guardStartPointPenaltyPerTile;
        score -= distancePenalty;
        reason += `, Distance penalty: -${distancePenalty.toFixed(1)}`;

        score += config.flag.guardStartPointBonus;
        reason += `, Guard bonus: +${config.flag.guardStartPointBonus}`;

        const target: EvaluatedTarget = {
            type: 'guardPoint',
            position: guardPosition,
            path,
            priorityScore: Math.max(0, score),
            reason,
        };

        results.push(target);
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

