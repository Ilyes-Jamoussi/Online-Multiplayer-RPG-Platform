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
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
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
        if (session.currentTurn.activePlayerId !== playerId) {
            throw new BadRequestException('Not your turn');
        }
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

        if (!player.actionsRemaining && !player.speed) {
            this.timerService.endTurnManual(session);
        }
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

        // Track tile visited after movement
        const player = session.inGamePlayers[playerId];
        if (player) {
            this.trackingService.trackTileVisited(sessionId, playerId, { x: player.x, y: player.y });
        }

        const availableActions = this.actionService.calculateAvailableActions(session, playerId);
        const reachableTiles = this.actionService.calculateReachableTiles(session, playerId);
        if (reachableTiles.length <= 1 && !availableActions.length) {
            this.timerService.endTurnManual(session);
        }
    }

    getReachableTiles(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        const reachableTiles = this.actionService.calculateReachableTiles(session, playerId);
        if (!reachableTiles.length && !player.actionsRemaining) {
            this.timerService.endTurnManual(session);
        }
    }

    getAvailableActions(sessionId: string, playerId: string) {
        const session = this.sessionRepository.findById(sessionId);
        this.actionService.calculateAvailableActions(session, playerId);
    }

    toggleAdminMode(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        if (!player) {
            throw new NotFoundException('Player not found');
        }

        if (!player.isAdmin) {
            throw new BadRequestException('Only admin can toggle admin mode');
        }

        session.isAdminModeActive = !session.isAdminModeActive;
        this.sessionRepository.update(session);

        this.eventEmitter.emit(ServerEvents.AdminModeToggled, {
            sessionId: session.id,
            playerId,
            isAdminModeActive: session.isAdminModeActive,
        });

        return session;
    }

    teleportPlayer(sessionId: string, playerId: string, position: Position): void {
        const session = this.sessionRepository.findById(sessionId);

        if (!session.isAdminModeActive) {
            throw new BadRequestException('Admin mode not active');
        }

        if (session.currentTurn.activePlayerId !== playerId) {
            throw new BadRequestException('Not your turn');
        }

        if (!this.actionService.isTileFree(sessionId, position)) {
            throw new BadRequestException('Tile is not free');
        }

        this.sessionRepository.movePlayerPosition(sessionId, playerId, position.x, position.y, 0);
        this.trackingService.trackTeleportation(sessionId);
        this.trackingService.trackTileVisited(sessionId, playerId, position);

        this.actionService.calculateReachableTiles(session, playerId);
        this.actionService.calculateAvailableActions(session, playerId);
    }

    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<Game> {
        return await this.actionService.fetchAndCacheGame(sessionId, gameId);
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

        // Déléguer à ActionService qui utilise CombatService
        this.actionService.selectCombatPosture(sessionId, playerId, posture);
    }

    handleVPCombat(sessionId: string, playerAId?: string, playerBId?: string): void {
        // Si les IDs ne sont pas fournis, récupérer le combat actif
        if (!playerAId || !playerBId) {
            const activeCombat = this.actionService.getActiveCombat(sessionId);
            if (!activeCombat) return;
            playerAId = activeCombat.playerAId;
            playerBId = activeCombat.playerBId;
        }

        // Sélectionner les postures pour tous les joueurs virtuels
        this.selectVPPosture(sessionId, playerAId);
        this.selectVPPosture(sessionId, playerBId);
    }

    executeOffensiveTurn(sessionId: string, playerId: string): void {
        this.executeOffensiveLoop(sessionId, playerId);
    }

    private executeOffensiveLoop(sessionId: string, playerId: string): void {
        if (!this.isPlayerAlive(sessionId, playerId)) return;

        this.moveToNearestPlayer(sessionId, playerId, () => {
            this.waitAndAttemptAttack(sessionId, playerId);
        });
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

            setTimeout(() => {
                this.moveProgressively(sessionId, playerId, target, onComplete);
            }, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
        } catch {
            onComplete();
        }
    }

    private isAdjacentTo(player1: Position, player2: Position): boolean {
        const distance = Math.abs(player1.x - player2.x) + Math.abs(player1.y - player2.y);
        return distance <= 1;
    }

    private waitAndAttemptAttack(sessionId: string, playerId: string): void {
        setTimeout(() => {
            this.attemptAttack(sessionId, playerId);
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
            if (action.type === AvailableActionType.ATTACK) {
                this.actionService.attackPlayer(sessionId, playerId, { x: action.x, y: action.y });
            }
            this.waitAndContinueIfPossible(sessionId, playerId);
        } catch {
            // Action impossible
        }
    }

    private waitAndContinueIfPossible(sessionId: string, playerId: string): void {
        setTimeout(() => {
            if (this.canContinueOffensive(sessionId, playerId)) {
                this.executeOffensiveLoop(sessionId, playerId);
            }
        }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private canContinueOffensive(sessionId: string, playerId: string): boolean {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        return player.health > 0 && (player.speed > 0 || player.actionsRemaining > 0);
    }

    executeDefensiveTurn(sessionId: string, playerId: string): void {
        this.executeDefensiveLoop(sessionId, playerId);
    }

    private executeDefensiveLoop(sessionId: string, playerId: string): void {
        if (!this.isPlayerAlive(sessionId, playerId)) return;

        this.moveAwayFromPlayers(sessionId, playerId, () => {
            this.waitAndContinueDefensive(sessionId, playerId);
        });
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

            setTimeout(() => {
                this.moveAwayFromPlayers(sessionId, playerId, onComplete);
            }, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS);
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

            // Calculer la distance minimale aux autres joueurs depuis cette position
            let minDistanceToPlayers = Infinity;
            for (const player of otherPlayers) {
                const distance = Math.abs(nextPosition.x - player.x) + Math.abs(nextPosition.y - player.y);
                minDistanceToPlayers = Math.min(minDistanceToPlayers, distance);
            }

            // Choisir la direction qui maximise la distance minimale
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

    private waitAndContinueDefensive(sessionId: string, playerId: string): void {
        setTimeout(() => {
            if (this.canContinueDefensive(sessionId, playerId)) {
                this.executeDefensiveLoop(sessionId, playerId);
            }
        }, VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private canContinueDefensive(sessionId: string, playerId: string): boolean {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        return player.health > 0 && player.speed > 0;
    }
}
