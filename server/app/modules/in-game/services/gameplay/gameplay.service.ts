/* eslint-disable max-lines -- This file contains extensive gameplay business logic and requires more lines than the standard limit */
import { VIRTUAL_PLAYER_ACTION_DELAY_MS, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS } from '@app/constants/virtual-player.constants';
import { ServerEvents } from '@app/enums/server-events.enum';
import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { TrackingService } from '@app/modules/in-game/services/tracking/tracking.service';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { FlagData } from '@common/interfaces/flag-data.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GameplayService {
    constructor(
        private readonly sessionRepository: InGameSessionRepository,
        private readonly actionService: ActionService,
        private readonly timerService: TimerService,
        private readonly eventEmitter: EventEmitter2,
        private readonly trackingService: TrackingService,
    ) {}

    endPlayerTurn(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        if (session.currentTurn.activePlayerId !== playerId) throw new BadRequestException('Not your turn');
        this.timerService.endTurnManual(session);
        return session;
    }

    toggleDoorAction(sessionId: string, playerId: string, position: Position): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        this.actionService.toggleDoor(session, playerId, position);
        this.trackingService.trackDoorToggled(sessionId, position);
        player.actionsRemaining--;
        session.currentTurn.hasUsedAction = true;
        this.actionService.calculateReachableTiles(session, playerId);
        if (!player.actionsRemaining && !player.speed) this.timerService.endTurnManual(session);
    }

    pickUpFlag(sessionId: string, playerId: string, position: Position): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (session.mode !== GameMode.CTF) throw new BadRequestException('Not a CTF game');
        this.actionService.pickUpFlag(session, playerId, position);
        player.actionsRemaining--;
        session.currentTurn.hasUsedAction = true;
        this.actionService.calculateReachableTiles(session, playerId);
        if (!player.actionsRemaining && !player.speed) this.timerService.endTurnManual(session);
    }

    requestFlagTransfer(sessionId: string, playerId: string, position: Position): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (session.mode !== GameMode.CTF) throw new BadRequestException('Not a CTF game');

        this.actionService.requestFlagTransfer(session, playerId, position);

        player.actionsRemaining--;
        session.currentTurn.hasUsedAction = true;
        this.actionService.calculateReachableTiles(session, playerId);
        if (!player.actionsRemaining && !player.speed) this.timerService.endTurnManual(session);
    }

    respondToFlagTransfer(sessionId: string, toPlayerId: string, fromPlayerId: string, accepted: boolean): void {
        this.actionService.respondToFlagTransfer(sessionId, toPlayerId, fromPlayerId, accepted);
    }

    sanctuaryRequest(sessionId: string, playerId: string, position: Position, kind: PlaceableKind.HEAL | PlaceableKind.FIGHT): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        this.actionService.sanctuaryRequest(session, playerId, position, kind);
    }

    performSanctuaryAction(sessionId: string, playerId: string, position: Position, double: boolean = false): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        this.actionService.performSanctuaryAction(session, playerId, position, double);
        this.trackingService.trackSanctuaryUsed(sessionId, position);
        player.actionsRemaining--;
    }

    movePlayer(sessionId: string, playerId: string, orientation: Orientation): void {
        const session = this.sessionRepository.findById(sessionId);
        if (playerId !== session.currentTurn.activePlayerId) throw new BadRequestException('Not your turn');
        if (this.timerService.getGameTimerState(sessionId) !== TurnTimerStates.PlayerTurn) throw new BadRequestException('Not your turn');
        this.actionService.movePlayer(session, playerId, orientation);
        const player = session.inGamePlayers[playerId];
        if (player) this.trackingService.trackTileVisited(sessionId, playerId, { x: player.x, y: player.y });
        const availableActions = this.actionService.calculateAvailableActions(session, playerId);
        const reachableTiles = this.actionService.calculateReachableTiles(session, playerId);
        if (reachableTiles.length <= 1 && !availableActions.length) this.timerService.endTurnManual(session);
    }

    getReachableTiles(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        const reachableTiles = this.actionService.calculateReachableTiles(session, playerId);
        if (!reachableTiles.length && !player.actionsRemaining) this.timerService.endTurnManual(session);
    }

    getAvailableActions(sessionId: string, playerId: string) {
        const session = this.sessionRepository.findById(sessionId);
        this.actionService.calculateAvailableActions(session, playerId);
    }

    toggleAdminMode(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (!player.isAdmin) throw new BadRequestException('Only admin can toggle admin mode');
        session.isAdminModeActive = !session.isAdminModeActive;
        this.sessionRepository.update(session);
        this.eventEmitter.emit(ServerEvents.AdminModeToggled, { sessionId: session.id, playerId, isAdminModeActive: session.isAdminModeActive });
        return session;
    }

    teleportPlayer(sessionId: string, playerId: string, position: Position): void {
        const session = this.sessionRepository.findById(sessionId);
        if (!session.isAdminModeActive) throw new BadRequestException('Admin mode not active');
        if (session.currentTurn.activePlayerId !== playerId) throw new BadRequestException('Not your turn');
        if (!this.actionService.isTileFree(sessionId, position)) throw new BadRequestException('Tile is not free');

        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');

        const tile = this.actionService.getTileAtPosition(sessionId, position);
        if (!tile) throw new NotFoundException('Tile not found');

        let finalPosition = position;
        const originPosition = { x: player.x, y: player.y };

        if (tile.kind === TileKind.TELEPORT) {
            try {
                const destination = this.actionService.getTeleportDestination(sessionId, position);
                const destinationOccupant = this.actionService.getTileOccupant(sessionId, destination);
                if (!destinationOccupant) {
                    finalPosition = destination;
                    this.eventEmitter.emit(ServerEvents.Teleported, {
                        session,
                        playerId,
                        originX: originPosition.x,
                        originY: originPosition.y,
                        destinationX: finalPosition.x,
                        destinationY: finalPosition.y,
                    });
                }
            } catch {
                finalPosition = position;
            }
        }

        this.sessionRepository.movePlayerPosition(sessionId, playerId, finalPosition.x, finalPosition.y, 0);
        this.trackingService.trackTileVisited(sessionId, playerId, finalPosition);

        if (session.mode === GameMode.CTF) {
            if (this.sessionRepository.playerHasFlag(session.id, playerId)) {
                this.sessionRepository.updateFlagPosition(session, playerId, finalPosition);
                this.checkCTFVictory(session, playerId, finalPosition);
            } else {
                const placeable = this.actionService.getPlaceableAtPosition(sessionId, finalPosition);
                if (placeable && placeable.kind === PlaceableKind.FLAG && placeable.placed) {
                    this.sessionRepository.pickUpFlag(session, playerId, finalPosition);
                }
            }
        }

        this.actionService.calculateReachableTiles(session, playerId);
        this.actionService.calculateAvailableActions(session, playerId);
    }

    private checkCTFVictory(session: InGameSession, playerId: string, position: Position): void {
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

    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<Game> {
        return await this.actionService.fetchAndCacheGame(sessionId, gameId);
    }

    getInitialFlagData(sessionId: string): FlagData | undefined {
        return this.actionService.getInitialFlagData(sessionId);
    }

    getSessionData(sessionId: string): InGameSession {
        return this.sessionRepository.findById(sessionId);
    }

    clearSessionResources(sessionId: string): void {
        this.actionService.clearSessionGameCache(sessionId);
        this.actionService.clearActiveCombatForSession(sessionId);
    }

    boardBoat(sessionId: string, playerId: string, position: Position): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (player.onBoatId) throw new BadRequestException('Player is already on a boat');
        this.actionService.boardBoat(session, playerId, position);
        player.actionsRemaining--;
    }

    disembarkBoat(sessionId: string, playerId: string, position: Position): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (!player.onBoatId) throw new BadRequestException('Player is not on a boat');
        this.actionService.disembarkBoat(session, playerId, position);
        player.actionsRemaining--;
    }

    selectVPPosture(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player?.virtualPlayerType) return;
        const posture = player.virtualPlayerType === VirtualPlayerType.Offensive ? CombatPosture.OFFENSIVE : CombatPosture.DEFENSIVE;
        this.actionService.selectCombatPosture(sessionId, playerId, posture);
    }

    handleVPFlagTransferRequest(sessionId: string, toPlayerId: string, fromPlayerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const toPlayer = session.inGamePlayers[toPlayerId];
        if (!toPlayer?.virtualPlayerType) return;
        this.respondToFlagTransfer(sessionId, toPlayerId, fromPlayerId, true);
    }

    handleVPCombat(sessionId: string, playerAId?: string, playerBId?: string): void {
        if (!playerAId || !playerBId) {
            const activeCombat = this.actionService.getActiveCombat(sessionId);
            if (!activeCombat) return;
            playerAId = activeCombat.playerAId;
            playerBId = activeCombat.playerBId;
        }
        this.selectVPPosture(sessionId, playerAId);
        this.selectVPPosture(sessionId, playerBId);
    }

    classicOffensiveTurn(sessionId: string, playerId: string): void {
        this.executeOffensiveLoop(sessionId, playerId);
    }

    private executeOffensiveLoop(sessionId: string, playerId: string): void {
        if (!this.isPlayerAlive(sessionId, playerId)) return;
        this.moveToNearestPlayer(sessionId, playerId, () => this.waitAndAttemptAttack(sessionId, playerId));
    }

    private isPlayerAlive(sessionId: string, playerId: string): boolean {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        return player.health > 0;
    }

    private moveToNearestPlayer(sessionId: string, playerId: string, onComplete: () => void): void {
        const nearestPlayer = this.findNearestPlayer(sessionId, playerId);
        if (!nearestPlayer) {
            onComplete();
            return;
        }
        this.moveProgressively(sessionId, playerId, nearestPlayer, onComplete);
    }

    private findNearestPlayer(sessionId: string, playerId: string): Position | null {
        const session = this.sessionRepository.findById(sessionId);
        const currentPlayer = session.inGamePlayers[playerId];
        const otherPlayers = Object.values(session.inGamePlayers).filter((p) => p.id !== playerId);
        if (otherPlayers.length === 0) return null;
        let nearestPlayer = otherPlayers[0];
        let minDistance = Math.abs(currentPlayer.x - nearestPlayer.x) + Math.abs(currentPlayer.y - nearestPlayer.y);
        for (const player of otherPlayers) {
            const distance = Math.abs(currentPlayer.x - player.x) + Math.abs(currentPlayer.y - player.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPlayer = player;
            }
        }
        return nearestPlayer as Position;
    }

    private moveProgressively(sessionId: string, playerId: string, target: Position, onComplete: () => void): void {
        const session = this.sessionRepository.findById(sessionId);
        const currentPlayer = session.inGamePlayers[playerId];
        if (currentPlayer.speed === 0 || this.isAdjacentTo(currentPlayer, target)) {
            onComplete();
            return;
        }
        const direction = this.actionService.calculateDirectionToTarget(currentPlayer, target);
        try {
            this.movePlayer(sessionId, playerId, direction);
            setTimeout(() => this.moveProgressively(sessionId, playerId, target, onComplete), VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
        } catch {
            onComplete();
        }
    }

    private isAdjacentTo(player1: Position, player2: Position): boolean {
        return Math.abs(player1.x - player2.x) + Math.abs(player1.y - player2.y) <= 1;
    }

    private waitAndAttemptAttack(sessionId: string, playerId: string): void {
        setTimeout(() => {
            this.attemptAttack(sessionId, playerId);
            this.repositionAfterCombat(sessionId, playerId);
        }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private repositionAfterCombat(sessionId: string, playerId: string): void {
        setTimeout(() => {
            const session = this.sessionRepository.findById(sessionId);
            const player = session.inGamePlayers[playerId];
            
            if (player.speed > 0) {
                this.moveToNearestPlayer(sessionId, playerId, () => this.endPlayerTurn(sessionId, playerId));
            } else {
                this.endPlayerTurn(sessionId, playerId);
            }
        }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private attemptAttack(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const currentPlayer = session.inGamePlayers[playerId];
        if (currentPlayer.actionsRemaining === 0) return;
        const availableActions = this.actionService.calculateAvailableActions(session, playerId);
        if (availableActions.length === 0) return;
        const action = availableActions[0];
        try {
            if (action.type === AvailableActionType.ATTACK) this.actionService.attackPlayer(sessionId, playerId, { x: action.x, y: action.y });
            this.waitAndContinueAttacking(sessionId, playerId);
        } catch {
            // Action impossible
        }
    }

    private waitAndContinueAttacking(sessionId: string, playerId: string): void {
        setTimeout(() => this.attemptAttack(sessionId, playerId), VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    classicDefensiveTurn(sessionId: string, playerId: string): void {
        this.executeDefensiveLoop(sessionId, playerId);
    }

    private executeDefensiveLoop(sessionId: string, playerId: string): void {
        if (!this.isPlayerAlive(sessionId, playerId)) return;
        this.moveAwayFromPlayers(sessionId, playerId, () => this.endPlayerTurn(sessionId, playerId));
    }

    private moveAwayFromPlayers(sessionId: string, playerId: string, onComplete: () => void): void {
        const session = this.sessionRepository.findById(sessionId);
        const currentPlayer = session.inGamePlayers[playerId];
        if (currentPlayer.speed === 0) {
            onComplete();
            return;
        }
        const safestDirection = this.findSafestDirection(sessionId, playerId);
        if (!safestDirection) {
            onComplete();
            return;
        }
        try {
            this.movePlayer(sessionId, playerId, safestDirection);
            setTimeout(() => this.moveAwayFromPlayers(sessionId, playerId, onComplete), VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
        } catch {
            onComplete();
        }
    }

    private findSafestDirection(sessionId: string, playerId: string): Orientation | null {
        const session = this.sessionRepository.findById(sessionId);
        const currentPlayer = session.inGamePlayers[playerId];
        const otherPlayers = Object.values(session.inGamePlayers).filter((p) => p.id !== playerId);
        if (otherPlayers.length === 0) return null;
        const directions = [Orientation.N, Orientation.E, Orientation.S, Orientation.W];
        let bestDirection = null;
        let maxMinDistance = -1;
        for (const direction of directions) {
            const nextPosition = this.getNextPosition(currentPlayer, direction);
            let minDistanceToPlayers = Infinity;
            for (const player of otherPlayers) {
                const distance = Math.abs(nextPosition.x - player.x) + Math.abs(nextPosition.y - player.y);
                minDistanceToPlayers = Math.min(minDistanceToPlayers, distance);
            }
            if (minDistanceToPlayers > maxMinDistance) {
                maxMinDistance = minDistanceToPlayers;
                bestDirection = direction;
            }
        }
        return bestDirection;
    }

    private getNextPosition(player: Position, direction: Orientation): Position {
        switch (direction) {
            case Orientation.N:
                return { x: player.x, y: player.y - 1 };
            case Orientation.E:
                return { x: player.x + 1, y: player.y };
            case Orientation.S:
                return { x: player.x, y: player.y + 1 };
            case Orientation.W:
                return { x: player.x - 1, y: player.y };
            default:
                return player;
        }
    }

    ctfOffensiveTurn(sessionId: string, playerId: string): void {
        this.executeCTFOffensiveLoop(sessionId, playerId);
    }

    ctfDefensiveTurn(sessionId: string, playerId: string): void {
        this.executeCTFDefensiveLoop(sessionId, playerId);
    }

    private executeCTFOffensiveLoop(sessionId: string, playerId: string): void {
        if (!this.isPlayerAlive(sessionId, playerId)) return;

        if (this.sessionRepository.playerHasFlag(sessionId, playerId)) {
            this.moveToStartPoint(sessionId, playerId, () => this.endPlayerTurn(sessionId, playerId));
        } else {
            const flagCarrier = this.findEnemyFlagCarrier(sessionId, playerId);
            if (flagCarrier) {
                this.moveToTarget(sessionId, playerId, flagCarrier, () => this.waitAndAttackThenEnd(sessionId, playerId));
            } else {
                this.moveToEnemyFlag(sessionId, playerId, () => this.waitAndPickUpFlagThenEnd(sessionId, playerId));
            }
        }
    }

    private executeCTFDefensiveLoop(sessionId: string, playerId: string): void {
        if (!this.isPlayerAlive(sessionId, playerId)) return;

        if (this.sessionRepository.playerHasFlag(sessionId, playerId)) {
            this.moveToStartPoint(sessionId, playerId, () => this.endPlayerTurn(sessionId, playerId));
        } else {
            const flagCarrier = this.findEnemyFlagCarrier(sessionId, playerId);
            if (flagCarrier) {
                const carrierStartPoint = this.getPlayerStartPoint(sessionId, flagCarrier.id);
                if (carrierStartPoint) {
                    this.moveToTarget(sessionId, playerId, carrierStartPoint, () => this.waitAndAttackThenEnd(sessionId, playerId));
                } else {
                    this.moveToEnemyFlag(sessionId, playerId, () => this.waitAndPickUpFlagThenEnd(sessionId, playerId));
                }
            } else {
                this.moveToEnemyFlag(sessionId, playerId, () => this.waitAndPickUpFlagThenEnd(sessionId, playerId));
            }
        }
    }

    private findEnemyFlagCarrier(sessionId: string, playerId: string): { id: string; x: number; y: number } | null {
        const session = this.sessionRepository.findById(sessionId);
        const playerTeam = this.getPlayerTeam(session, playerId);

        for (const otherPlayer of Object.values(session.inGamePlayers)) {
            if (otherPlayer.id === playerId) continue;
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

    private moveToStartPoint(sessionId: string, playerId: string, onComplete: () => void): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        const startPoint = this.sessionRepository.findStartPointById(sessionId, player.startPointId);

        if (!startPoint) {
            onComplete();
            return;
        }

        if (player.x === startPoint.x && player.y === startPoint.y) {
            onComplete();
            return;
        }

        this.moveProgressively(sessionId, playerId, startPoint, onComplete);
    }

    private moveToEnemyFlag(sessionId: string, playerId: string, onComplete: () => void): void {
        const session = this.sessionRepository.findById(sessionId);
        const flagData = session.flagData;

        if (!flagData) {
            onComplete();
            return;
        }

        if (flagData.holderPlayerId) {
            const carrier = session.inGamePlayers[flagData.holderPlayerId];
            if (carrier) {
                this.moveToTarget(sessionId, playerId, carrier, onComplete);
                return;
            }
        }

        this.moveToTarget(sessionId, playerId, flagData.position, onComplete);
    }

    private moveToTarget(sessionId: string, playerId: string, target: Position, onComplete: () => void): void {
        this.moveProgressively(sessionId, playerId, target, onComplete);
    }

    private getPlayerStartPoint(sessionId: string, playerId: string): Position | null {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) return null;
        return this.sessionRepository.findStartPointById(sessionId, player.startPointId);
    }

    private waitAndPickUpFlagThenEnd(sessionId: string, playerId: string): void {
        setTimeout(() => {
            this.attemptPickUpFlag(sessionId, playerId);
            this.endPlayerTurn(sessionId, playerId);
        }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private waitAndAttackThenEnd(sessionId: string, playerId: string): void {
        setTimeout(() => {
            this.attemptAttack(sessionId, playerId);
            this.endPlayerTurn(sessionId, playerId);
        }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private attemptPickUpFlag(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (player.actionsRemaining === 0) return;

        try {
            const playerPosition = { x: player.x, y: player.y };
            this.pickUpFlag(sessionId, playerId, playerPosition);
        } catch {
            // Action impossible
        }
    }
}
