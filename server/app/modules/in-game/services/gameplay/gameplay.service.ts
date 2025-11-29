import { ServerEvents } from '@app/enums/server-events.enum';
import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { TrackingService } from '@app/modules/in-game/services/tracking/tracking.service';
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
}
