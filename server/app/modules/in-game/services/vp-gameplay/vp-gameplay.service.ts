import { DEFENSIVE_VP_CONFIG, OFFENSIVE_VP_CONFIG } from '@app/constants/vp.config';
import { PointOfInterestType } from '@app/enums/point-of-interest-type.enum';
import { VPConfig } from '@app/interfaces/vp-config.interface';
import {
    EvaluatedTarget,
    MapScanResult,
    MapScanWithDistances,
    PointOfInterest,
    PointOfInterestWithPath,
    VPDecision,
} from '@app/interfaces/vp-gameplay.interface';
import { PathResult } from '@app/interfaces/vp-pathfinding.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { VPCTFService } from '@app/modules/in-game/services/vp-ctf/vp-ctf.service';
import { VPPathfindingService } from '@app/modules/in-game/services/vp-pathfinding/vp-pathfinding.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Inject, Injectable, forwardRef } from '@nestjs/common';

export { EvaluatedTarget, MapScanResult, MapScanWithDistances, PointOfInterest, PointOfInterestWithPath, VPDecision };

@Injectable()
export class VPGameplayService {
    constructor(
        private readonly gameCache: GameCacheService,
        private readonly pathfindingService: VPPathfindingService,
        @Inject(forwardRef(() => VPCTFService)) private readonly ctfService: VPCTFService,
    ) {}

    getConfigForType(vpType: VirtualPlayerType): VPConfig {
        return vpType === VirtualPlayerType.Offensive ? OFFENSIVE_VP_CONFIG : DEFENSIVE_VP_CONFIG;
    }

    makeDecision(session: InGameSession, vpPlayerId: string, vpType: VirtualPlayerType): VPDecision {
        const player = session.inGamePlayers[vpPlayerId];
        if (!player) {
            return { target: null, allEvaluatedTargets: [], useDoubleAction: false };
        }

        const config = this.getConfigForType(vpType);

        const pointsWithDistances = this.calculateDistancesToPointsOfInterest(session, vpPlayerId);
        const evaluatedTargets: EvaluatedTarget[] = [];

        this.evaluateEnemies(pointsWithDistances.enemies, evaluatedTargets, config);
        this.evaluateHealSanctuaries(pointsWithDistances.healSanctuaries, player, evaluatedTargets, config);
        this.evaluateFightSanctuaries(pointsWithDistances.fightSanctuaries, player, evaluatedTargets, config);

        let ctfObjectiveActive = false;
        if (session.mode === GameMode.CTF) {
            ctfObjectiveActive = this.ctfService.evaluateCTFObjectives(session, vpPlayerId, pointsWithDistances, evaluatedTargets, config);
        }

        if (config.priorities.escape && !ctfObjectiveActive) {
            this.evaluateEscape(session, vpPlayerId, pointsWithDistances.enemies, evaluatedTargets, config);
        }

        evaluatedTargets.sort((a, b) => b.priorityScore - a.priorityScore);

        const bestTarget = evaluatedTargets.length && evaluatedTargets[0].priorityScore ? evaluatedTargets[0] : null;
        const useDoubleAction = bestTarget?.type === PointOfInterestType.FIGHT_SANCTUARY && Math.random() < config.fightSanctuary.doubleActionRate;

        return {
            target: bestTarget,
            allEvaluatedTargets: evaluatedTargets,
            useDoubleAction,
        };
    }

    private evaluateEnemies(enemies: PointOfInterestWithPath[], results: EvaluatedTarget[], config: VPConfig): void {
        for (const enemy of enemies) {
            if (!enemy.path.reachable) continue;
            const distance = enemy.path.totalCost;
            let score = config.priorities.attack - distance * config.distanceWeights.attackPenaltyPerTile;
            if (distance === 0) score += config.bonuses.adjacentAttackBonus;
            results.push({ ...enemy, priorityScore: Math.max(0, score) });
        }
    }

    private evaluateHealSanctuaries(sanctuaries: PointOfInterestWithPath[], player: Player, results: EvaluatedTarget[], config: VPConfig): void {
        const healthPercent = player.health / player.maxHealth;
        if (healthPercent >= config.health.healThreshold) return;

        for (const sanctuary of sanctuaries) {
            if (!sanctuary.path.reachable) continue;
            const distance = sanctuary.path.totalCost;
            if (distance > config.maxDistances.maxHealDistance) continue;

            let score = config.priorities.heal - distance * config.distanceWeights.healPenaltyPerTile + config.bonuses.lowHealthHealBonus;
            if (healthPercent < config.health.criticalHealthThreshold) score += config.bonuses.criticalHealthHealBonus;
            results.push({ ...sanctuary, priorityScore: Math.max(0, score) });
        }
    }

    private evaluateFightSanctuaries(sanctuaries: PointOfInterestWithPath[], player: Player, results: EvaluatedTarget[], config: VPConfig): void {
        if (player.attackBonus || player.defenseBonus) return;

        for (const sanctuary of sanctuaries) {
            if (!sanctuary.path.reachable) continue;
            const distance = sanctuary.path.totalCost;
            if (distance > config.maxDistances.maxFightSanctuaryDistance) continue;

            const score =
                config.priorities.fightSanctuary -
                distance * config.distanceWeights.fightSanctuaryPenaltyPerTile +
                config.bonuses.noBonusFightSanctuaryBonus;
            results.push({ ...sanctuary, priorityScore: Math.max(0, score) });
        }
    }

    private evaluateEscape(
        session: InGameSession,
        vpPlayerId: string,
        enemies: PointOfInterestWithPath[],
        results: EvaluatedTarget[],
        config: VPConfig,
    ): void {
        if (!enemies.length) return;

        const nearestEnemy = enemies.reduce(
            (nearest, enemy) => (enemy.path.reachable && enemy.path.totalCost < nearest ? enemy.path.totalCost : nearest),
            Infinity,
        );
        if (nearestEnemy > config.escape.enemyProximityTiles) return;

        const escapePoint = this.pathfindingService.findBestEscapePoint(session, vpPlayerId, enemies);
        if (!escapePoint) return;

        const score =
            config.priorities.escape +
            config.bonuses.escapeWhenEnemyCloseBonus +
            escapePoint.distanceFromEnemies * config.escape.distanceBonusPerTile;
        results.push({ type: PointOfInterestType.ESCAPE, position: escapePoint.position, path: escapePoint.path, priorityScore: Math.max(0, score) });
    }

    scanMapForPointsOfInterest(session: InGameSession, vpPlayerId: string): MapScanResult {
        const result: MapScanResult = {
            enemies: [],
            healSanctuaries: [],
            fightSanctuaries: [],
            boats: [],
            flags: [],
            all: [],
        };

        this.scanForEnemies(session, vpPlayerId, result);
        this.scanForPlaceables(session, result);
        result.all = [...result.enemies, ...result.healSanctuaries, ...result.fightSanctuaries, ...result.boats, ...result.flags];

        return result;
    }

    private scanForEnemies(session: InGameSession, vpPlayerId: string, result: MapScanResult): void {
        const vpPlayer = session.inGamePlayers[vpPlayerId];
        if (!vpPlayer) return;

        for (const [playerId, player] of Object.entries(session.inGamePlayers)) {
            if (playerId === vpPlayerId) continue;
            if (!player.health) continue;
            if (session.mode === GameMode.CTF && player.teamNumber === vpPlayer.teamNumber) continue;

            result.enemies.push({
                type: PointOfInterestType.ENEMY,
                position: { x: player.x, y: player.y },
                playerId,
            });
        }
    }

    private scanForPlaceables(session: InGameSession, result: MapScanResult): void {
        const gameMap = this.gameCache.getGameMapForSession(session.id);
        if (!gameMap) return;

        for (const placeable of gameMap.objects) {
            if (!placeable.placed) continue;

            const position: Position = { x: placeable.x, y: placeable.y };

            switch (placeable.kind) {
                case PlaceableKind.HEAL:
                    result.healSanctuaries.push({ type: PointOfInterestType.HEAL_SANCTUARY, position });
                    break;
                case PlaceableKind.FIGHT:
                    result.fightSanctuaries.push({ type: PointOfInterestType.FIGHT_SANCTUARY, position });
                    break;
                case PlaceableKind.BOAT:
                    result.boats.push({ type: PointOfInterestType.BOAT, position });
                    break;
                case PlaceableKind.FLAG:
                    result.flags.push({ type: PointOfInterestType.FLAG, position, isHeld: session.flagData?.holderPlayerId !== null });
                    break;
            }
        }
    }

    calculateDistancesToPointsOfInterest(session: InGameSession, vpPlayerId: string): MapScanWithDistances {
        const scanResult = this.scanMapForPointsOfInterest(session, vpPlayerId);

        const result: MapScanWithDistances = {
            enemies: this.addPathsToAdjacentTiles(session, vpPlayerId, scanResult.enemies),
            healSanctuaries: this.addPathsToAdjacentTiles(session, vpPlayerId, scanResult.healSanctuaries),
            fightSanctuaries: this.addPathsToAdjacentTiles(session, vpPlayerId, scanResult.fightSanctuaries),
            boats: this.addPathsToAdjacentTiles(session, vpPlayerId, scanResult.boats),
            flags: this.addPathsToPoints(session, vpPlayerId, scanResult.flags),
            all: [],
        };

        result.all = [...result.enemies, ...result.healSanctuaries, ...result.fightSanctuaries, ...result.boats, ...result.flags];

        return result;
    }

    private addPathsToPoints(session: InGameSession, vpPlayerId: string, points: PointOfInterest[]): PointOfInterestWithPath[] {
        return points.map((point) => ({
            ...point,
            path: this.pathfindingService.findPath(session, vpPlayerId, point.position),
        }));
    }

    private addPathsToAdjacentTiles(session: InGameSession, vpPlayerId: string, points: PointOfInterest[]): PointOfInterestWithPath[] {
        return points.map((point) => ({
            ...point,
            path: this.findBestPathToAdjacent(session, vpPlayerId, point.position),
        }));
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
                if (!bestPath || this.isPathBetter(path, bestPath, player.actionsRemaining)) {
                    bestPath = path;
                }
            }
        }

        return bestPath || this.createUnreachableResult(targetPosition);
    }

    private isPathBetter(newPath: PathResult, currentBest: PathResult, actionsRemaining: number): boolean {
        const newAllowsAction = newPath.actionsRequired < actionsRemaining;
        const currentAllowsAction = currentBest.actionsRequired < actionsRemaining;

        if (newAllowsAction && !currentAllowsAction) return true;
        if (!newAllowsAction && currentAllowsAction) return false;

        return newPath.totalCost < currentBest.totalCost;
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
        if (!tile) return false;

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

    findNearestPoint(pointsWithPath: PointOfInterestWithPath[]): PointOfInterestWithPath | null {
        const reachable = pointsWithPath.filter((p) => p.path.reachable);
        if (!reachable.length) return null;

        reachable.sort((a, b) => a.path.totalCost - b.path.totalCost);
        return reachable[0];
    }

    getReachablePointsSortedByDistance(pointsWithPath: PointOfInterestWithPath[]): PointOfInterestWithPath[] {
        return pointsWithPath.filter((p) => p.path.reachable).sort((a, b) => a.path.totalCost - b.path.totalCost);
    }
}
