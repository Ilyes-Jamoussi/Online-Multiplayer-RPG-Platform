import { VIRTUAL_PLAYER_ACTION_DELAY_MS, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS } from '@app/constants/virtual-player.constants';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VPStrategyService {
    constructor(
        private readonly sessionRepository: InGameSessionRepository,
        private readonly actionService: ActionService,
        private readonly timerService: TimerService,
    ) {}

    executeClassicOffensiveTurn(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        
        if (player.health <= 0) {
            this.endTurn(sessionId, playerId);
            return;
        }

        if (this.tryAttack(sessionId, playerId)) return;
        if (this.trySanctuary(sessionId, playerId)) return;
        this.moveTowardsNearestEnemy(sessionId, playerId);
    }

    executeClassicDefensiveTurn(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        
        if (player.health <= 0) {
            this.endTurn(sessionId, playerId);
            return;
        }

        if (this.trySanctuary(sessionId, playerId)) return;

        const nearestEnemy = this.findNearestEnemy(sessionId, playerId);
        if (nearestEnemy && this.getManhattanDistance(player, nearestEnemy) <= 3) {
            this.fleeFromEnemies(sessionId, playerId);
        } else {
            this.moveRandomly(sessionId, playerId);
        }
    }

    executeCtfOffensiveTurn(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        
        if (player.health <= 0) {
            this.endTurn(sessionId, playerId);
            return;
        }

        if (this.sessionRepository.playerHasFlag(sessionId, playerId)) {
            this.returnFlagToBase(sessionId, playerId);
            return;
        }

        const enemyFlagCarrier = this.findEnemyFlagCarrier(sessionId, playerId);
        
        if (enemyFlagCarrier) {
            this.chaseAndAttackFlagCarrier(sessionId, playerId, enemyFlagCarrier);
        } else {
            this.goToEnemyFlagAndPickup(sessionId, playerId);
        }
    }

    handlePostCombatCTF(sessionId: string, winnerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const winner = session.inGamePlayers[winnerId];
        
        if (this.sessionRepository.playerHasFlag(sessionId, winnerId)) {
            this.returnFlagToBase(sessionId, winnerId);
            return;
        }
        
        const flagData = session.flagData;
        if (flagData && winner.x === flagData.position.x && winner.y === flagData.position.y && winner.actionsRemaining > 0) {
            this.pickupFlagAndReturnToBase(sessionId, winnerId);
            return;
        }

        if (winner.virtualPlayerType === 'offensive') {
            this.executeCtfOffensiveTurn(sessionId, winnerId);
        } else {
            this.executeCtfDefensiveTurn(sessionId, winnerId);
        }
    }

    executeCtfDefensiveTurn(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        
        if (player.health <= 0) {
            this.endTurn(sessionId, playerId);
            return;
        }

        if (this.sessionRepository.playerHasFlag(sessionId, playerId)) {
            this.returnFlagToBase(sessionId, playerId);
            return;
        }

        const enemyFlagCarrier = this.findEnemyFlagCarrier(sessionId, playerId);
        
        if (enemyFlagCarrier) {
            const carrierStartPoint = this.getPlayerStartPoint(sessionId, enemyFlagCarrier.id);
            if (carrierStartPoint) {
                if (this.isAdjacent(player, carrierStartPoint) || (player.x === carrierStartPoint.x && player.y === carrierStartPoint.y)) {
                    if (this.tryAttack(sessionId, playerId)) return;
                }
                this.moveTowardsTarget(sessionId, playerId, carrierStartPoint);
            } else {
                this.moveTowardsTarget(sessionId, playerId, enemyFlagCarrier);
            }
        } else {
            this.guardOwnFlag(sessionId, playerId);
        }
    }

    private tryAttack(sessionId: string, playerId: string): boolean {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        
        if (player.actionsRemaining === 0) return false;

        const availableActions = this.actionService.calculateAvailableActions(session, playerId);
        const attackAction = availableActions.find((a) => a.type === AvailableActionType.ATTACK);
        
        if (attackAction) {
            setTimeout(() => {
                this.actionService.attackPlayer(sessionId, playerId, { x: attackAction.x, y: attackAction.y });
            }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
            return true;
        }
        
        return false;
    }

    private trySanctuary(sessionId: string, playerId: string): boolean {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        
        if (player.actionsRemaining === 0) return false;

        const availableActions = this.actionService.calculateAvailableActions(session, playerId);
        
        const healAction = availableActions.find((a) => a.type === AvailableActionType.HEAL);
        if (healAction && player.health < player.maxHealth) {
            setTimeout(() => {
                this.actionService.sanctuaryRequest(session, playerId, { x: healAction.x, y: healAction.y }, PlaceableKind.HEAL);
                this.continueAfterAction(sessionId, playerId);
            }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
            return true;
        }
        
        const fightAction = availableActions.find((a) => a.type === AvailableActionType.FIGHT);
        if (fightAction) {
            setTimeout(() => {
                this.actionService.sanctuaryRequest(session, playerId, { x: fightAction.x, y: fightAction.y }, PlaceableKind.FIGHT);
                this.continueAfterAction(sessionId, playerId);
            }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
            return true;
        }
        
        return false;
    }

    private moveTowardsNearestEnemy(sessionId: string, playerId: string): void {
        const nearestEnemy = this.findNearestEnemy(sessionId, playerId);
        if (!nearestEnemy) {
            this.endTurn(sessionId, playerId);
            return;
        }
        this.moveTowardsTarget(sessionId, playerId, nearestEnemy);
    }

    private moveTowardsTarget(sessionId: string, playerId: string, target: Position, stopWhenAdjacent: boolean = true): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        
        if (player.x === target.x && player.y === target.y) {
            this.handleArrivalAtTarget(sessionId, playerId);
            return;
        }

        if (player.speed === 0) {
            this.handleArrivalAtTarget(sessionId, playerId);
            return;
        }

        if (stopWhenAdjacent && this.isAdjacent(player, target)) {
            this.handleArrivalAtTarget(sessionId, playerId);
            return;
        }

        const direction = this.actionService.calculateDirectionToTarget(player, target);
        this.actionService.movePlayer(session, playerId, direction);
        
        setTimeout(() => {
            this.moveTowardsTarget(sessionId, playerId, target, stopWhenAdjacent);
        }, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
    }

    private handleArrivalAtTarget(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        if (player.actionsRemaining > 0) {
            if (this.tryAttack(sessionId, playerId)) return;
            
            if (session.mode === GameMode.CTF && !this.sessionRepository.playerHasFlag(sessionId, playerId)) {
                const flagData = session.flagData;
                if (flagData && player.x === flagData.position.x && player.y === flagData.position.y) {
                    this.pickupFlagAndReturnToBase(sessionId, playerId);
                    return;
                }
            }
        }

        this.endTurn(sessionId, playerId);
    }

    private pickupFlagAndReturnToBase(sessionId: string, playerId: string): void {
        setTimeout(() => {
            const session = this.sessionRepository.findById(sessionId);
            const player = session.inGamePlayers[playerId];
            this.actionService.pickUpFlag(session, playerId, { x: player.x, y: player.y });
            
            setTimeout(() => {
                this.returnFlagToBase(sessionId, playerId);
            }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
        }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private fleeFromEnemies(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        
        if (player.speed === 0) {
            this.endTurn(sessionId, playerId);
            return;
        }

        const safestDirection = this.findSafestDirection(sessionId, playerId);
        if (!safestDirection) {
            this.endTurn(sessionId, playerId);
            return;
        }

        this.actionService.movePlayer(session, playerId, safestDirection);
        
        setTimeout(() => {
            const updatedSession = this.sessionRepository.findById(sessionId);
            const updatedPlayer = updatedSession.inGamePlayers[playerId];
            
            if (updatedPlayer.speed > 0) {
                this.fleeFromEnemies(sessionId, playerId);
            } else {
                this.endTurn(sessionId, playerId);
            }
        }, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
    }

    private moveRandomly(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        
        if (player.speed === 0) {
            this.endTurn(sessionId, playerId);
            return;
        }

        const directions = [Orientation.N, Orientation.E, Orientation.S, Orientation.W];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        
        this.actionService.movePlayer(session, playerId, randomDirection);
        
        setTimeout(() => {
            const updatedSession = this.sessionRepository.findById(sessionId);
            const updatedPlayer = updatedSession.inGamePlayers[playerId];
            
            if (updatedPlayer.speed > 0) {
                this.moveRandomly(sessionId, playerId);
            } else {
                this.endTurn(sessionId, playerId);
            }
        }, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
    }

    private returnFlagToBase(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        const startPoint = this.sessionRepository.findStartPointById(sessionId, player.startPointId);

        if (player.x === startPoint.x && player.y === startPoint.y) {
            this.endTurn(sessionId, playerId);
            return;
        }

        if (this.isAdjacent(player, startPoint)) {
            const occupant = Object.values(session.inGamePlayers).find(
                p => p.x === startPoint.x && p.y === startPoint.y && p.id !== playerId && p.health > 0
            );
            
            if (occupant && player.actionsRemaining > 0) {
                if (this.tryAttack(sessionId, playerId)) return;
            }
            
            this.endTurn(sessionId, playerId);
            return;
        }

        this.moveTowardsTarget(sessionId, playerId, startPoint, false);
    }

    private chaseAndAttackFlagCarrier(sessionId: string, playerId: string, carrier: Position): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        if (this.isAdjacent(player, carrier)) {
            if (this.tryAttack(sessionId, playerId)) return;
        }

        this.moveTowardsTarget(sessionId, playerId, carrier);
    }

    private goToEnemyFlagAndPickup(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const flagData = session.flagData;
        const player = session.inGamePlayers[playerId];
        const flagPosition = flagData.position;

        if (player.x === flagPosition.x && player.y === flagPosition.y && player.actionsRemaining > 0) {
            this.pickupFlagAndReturnToBase(sessionId, playerId);
            return;
        }

        this.moveTowardsTarget(sessionId, playerId, flagPosition, false);
    }

    private guardOwnFlag(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const flagData = session.flagData;
        const player = session.inGamePlayers[playerId];
        const flagPosition = flagData.position;

        if (player.x === flagPosition.x && player.y === flagPosition.y) {
            this.endTurn(sessionId, playerId);
            return;
        }

        this.moveTowardsTarget(sessionId, playerId, flagPosition);
    }

    private findNearestEnemy(sessionId: string, playerId: string): Position | null {
        const session = this.sessionRepository.findById(sessionId);
        const currentPlayer = session.inGamePlayers[playerId];
        const currentTeam = this.getPlayerTeam(session, playerId);
        
        const enemies = Object.values(session.inGamePlayers).filter((p) => {
            if (p.id === playerId || p.health <= 0) return false;
            const enemyTeam = this.getPlayerTeam(session, p.id);
            return session.mode === GameMode.CTF ? currentTeam !== enemyTeam : true;
        });

        if (enemies.length === 0) return null;

        let nearestEnemy = enemies[0];
        let minDistance = this.getManhattanDistance(currentPlayer, nearestEnemy);

        for (const enemy of enemies) {
            const distance = this.getManhattanDistance(currentPlayer, enemy);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        }

        return { x: nearestEnemy.x, y: nearestEnemy.y };
    }

    private findEnemyFlagCarrier(sessionId: string, playerId: string): Position & { id: string } | null {
        const session = this.sessionRepository.findById(sessionId);
        const playerTeam = this.getPlayerTeam(session, playerId);

        for (const otherPlayer of Object.values(session.inGamePlayers)) {
            if (otherPlayer.id === playerId || otherPlayer.health <= 0) continue;
            
            const otherTeam = this.getPlayerTeam(session, otherPlayer.id);
            if (playerTeam === otherTeam) continue;
            
            if (this.sessionRepository.playerHasFlag(sessionId, otherPlayer.id)) {
                return { id: otherPlayer.id, x: otherPlayer.x, y: otherPlayer.y };
            }
        }

        return null;
    }

    private getPlayerTeam(session: InGameSession, playerId: string): number | null {
        for (const [teamNumber, team] of Object.entries(session.teams)) {
            if (team.playerIds.includes(playerId)) {
                return Number(teamNumber);
            }
        }
        return null;
    }

    private getPlayerStartPoint(sessionId: string, playerId: string): Position | null {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        return this.sessionRepository.findStartPointById(sessionId, player.startPointId);
    }

    private findSafestDirection(sessionId: string, playerId: string): Orientation | null {
        const session = this.sessionRepository.findById(sessionId);
        const currentPlayer = session.inGamePlayers[playerId];
        const enemies = Object.values(session.inGamePlayers).filter((p) => p.id !== playerId && p.health > 0);

        if (enemies.length === 0) return null;

        const directions = [Orientation.N, Orientation.E, Orientation.S, Orientation.W];
        let bestDirection = null;
        let maxMinDistance = -1;

        for (const direction of directions) {
            const nextPosition = this.getNextPosition(currentPlayer, direction);
            let minDistanceToEnemies = Infinity;

            for (const enemy of enemies) {
                const distance = this.getManhattanDistance(nextPosition, enemy);
                minDistanceToEnemies = Math.min(minDistanceToEnemies, distance);
            }

            if (minDistanceToEnemies > maxMinDistance) {
                maxMinDistance = minDistanceToEnemies;
                bestDirection = direction;
            }
        }

        return bestDirection;
    }

    private getNextPosition(position: Position, direction: Orientation): Position {
        switch (direction) {
            case Orientation.N:
                return { x: position.x, y: position.y - 1 };
            case Orientation.E:
                return { x: position.x + 1, y: position.y };
            case Orientation.S:
                return { x: position.x, y: position.y + 1 };
            case Orientation.W:
                return { x: position.x - 1, y: position.y };
            default:
                return position;
        }
    }

    private getManhattanDistance(pos1: Position, pos2: Position): number {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    private isAdjacent(pos1: Position, pos2: Position): boolean {
        return this.getManhattanDistance(pos1, pos2) === 1;
    }

    private continueAfterAction(sessionId: string, playerId: string): void {
        setTimeout(() => {
            const session = this.sessionRepository.findById(sessionId);
            const player = session.inGamePlayers[playerId];

            if (player.actionsRemaining === 0 && player.speed === 0) {
                this.endTurn(sessionId, playerId);
                return;
            }

            const isCtf = session.mode === GameMode.CTF;
            const isOffensive = player.virtualPlayerType === 'offensive';

            if (isCtf) {
                if (isOffensive) {
                    this.executeCtfOffensiveTurn(sessionId, playerId);
                } else {
                    this.executeCtfDefensiveTurn(sessionId, playerId);
                }
            } else {
                if (isOffensive) {
                    this.executeClassicOffensiveTurn(sessionId, playerId);
                } else {
                    this.executeClassicDefensiveTurn(sessionId, playerId);
                }
            }
        }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private endTurn(sessionId: string, playerId: string): void {
        setTimeout(() => {
            const session = this.sessionRepository.findById(sessionId);
            if (session.currentTurn.activePlayerId === playerId) {
                this.timerService.endTurnManual(session);
            }
        }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }
}
