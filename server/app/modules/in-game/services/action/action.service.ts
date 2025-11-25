import { ServerEvents } from '@app/enums/server-events.enum';
import { ActiveCombat } from '@app/interfaces/active-combat.interface';
import { PendingFlagTransfer } from '@app/interfaces/pending-flag-transfer.interface';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { MovementService } from '@app/modules/in-game/services/movement/movement.service';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { FlagData } from '@common/interfaces/flag-data.interface';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ActionService {
    private readonly pendingFlagTransfers = new Map<string, PendingFlagTransfer>();

    constructor(
        private readonly gameCache: GameCacheService,
        private readonly movementService: MovementService,
        private readonly combatService: CombatService,
        private readonly eventEmitter: EventEmitter2,
        private readonly sessionRepository: InGameSessionRepository,
    ) {}

    pickUpFlag(session: InGameSession, playerId: string, position: Position): void {
        if (!session.inGamePlayers[playerId]) throw new NotFoundException('Player not found');
        if (!session.flagData) throw new NotFoundException('Flag data not found');
        if (session.flagData.holderPlayerId) throw new BadRequestException('Flag already picked up');
        this.sessionRepository.pickUpFlag(session, playerId, position);
    }

    transferFlag(session: InGameSession, playerId: string, position: Position): void {
        if (!session.inGamePlayers[playerId]) throw new NotFoundException('Player not found');
        if (!session.flagData) throw new NotFoundException('Flag data not found');
        if (session.flagData.holderPlayerId !== playerId) throw new BadRequestException('Player does not hold the flag');

        const toPlayerId = this.getTileOccupant(session.id, position);
        if (!toPlayerId) throw new NotFoundException('No player at target position');
        this.sessionRepository.transferFlag(session, playerId, toPlayerId);

        const toPlayer = session.inGamePlayers[toPlayerId];
        if (toPlayer) {
            this.movementService.checkCTFVictory(session, toPlayerId, { x: toPlayer.x, y: toPlayer.y });
        }
    }

    requestFlagTransfer(session: InGameSession, playerId: string, position: Position): void {
        const flagData = session.flagData;
        if (!flagData || flagData.holderPlayerId !== playerId) throw new BadRequestException('Player does not hold the flag');
        const toPlayerId = this.getTileOccupant(session.id, position);
        if (!toPlayerId || toPlayerId === playerId) throw new BadRequestException('Invalid target player');
        const fromPlayer = session.inGamePlayers[playerId];
        const toPlayer = session.inGamePlayers[toPlayerId];
        if (!fromPlayer || !toPlayer) throw new NotFoundException('Player not found');
        this.validateTeammates(fromPlayer, toPlayer);
        const requestKey = this.generateFlagTransferRequestKey(session.id, playerId, toPlayerId);
        if (this.pendingFlagTransfers.has(requestKey)) throw new BadRequestException('Transfer request already pending');
        this.pendingFlagTransfers.set(requestKey, { sessionId: session.id, fromPlayerId: playerId, toPlayerId, position });
        this.eventEmitter.emit(ServerEvents.FlagTransferRequested, { session, fromPlayerId: playerId, toPlayerId, fromPlayerName: fromPlayer.name });
    }

    private validateTeammates(fromPlayer: Player, toPlayer: Player): void {
        if (!Boolean(fromPlayer.teamNumber) || !Boolean(toPlayer.teamNumber) || fromPlayer.teamNumber !== toPlayer.teamNumber) {
            throw new BadRequestException('Can only transfer flag to teammate');
        }
    }

    private generateFlagTransferRequestKey(sessionId: string, fromPlayerId: string, toPlayerId: string): string {
        return `${sessionId}-${fromPlayerId}-${toPlayerId}`;
    }

    respondToFlagTransfer(sessionId: string, toPlayerId: string, fromPlayerId: string, accepted: boolean): void {
        const requestKey = this.generateFlagTransferRequestKey(sessionId, fromPlayerId, toPlayerId);
        const request = this.pendingFlagTransfers.get(requestKey);
        if (!request) throw new NotFoundException('Transfer request not found');
        this.pendingFlagTransfers.delete(requestKey);
        if (accepted) {
            const session = this.sessionRepository.findById(sessionId);
            this.transferFlag(session, fromPlayerId, request.position);
        }
        this.eventEmitter.emit(ServerEvents.FlagTransferResult, { sessionId, fromPlayerId, toPlayerId, accepted });
    }

    getTileOccupant(sessionId: string, position: Position): string | null {
        return this.gameCache.getTileOccupant(sessionId, position);
    }

    toggleDoor(session: InGameSession, playerId: string, position: Position): void {
        const gameMap = this.gameCache.getGameMapForSession(session.id);
        const tile = gameMap.tiles.find((t) => t.x === position.x && t.y === position.y);

        if (tile && tile.kind === TileKind.DOOR) {
            tile.open = !tile.open;

            this.eventEmitter.emit(ServerEvents.DoorToggled, {
                session,
                playerId,
                x: position.x,
                y: position.y,
                isOpen: tile.open,
            });
        }
    }

    sanctuaryRequest(session: InGameSession, playerId: string, position: Position, kind: PlaceableKind.HEAL | PlaceableKind.FIGHT): void {
        const object = this.gameCache.getPlaceableAtPosition(session.id, position);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');

        if (kind === PlaceableKind.FIGHT && player.attackBonus && player.defenseBonus) {
            this.eventEmitter.emit(ServerEvents.OpenSanctuaryDenied, {
                session,
                playerId,
                message: 'Vous ne pouvez pas utiliser cette action car vous avez des bonus de combat',
            });
        } else if (kind === PlaceableKind.HEAL && player.health === player.maxHealth) {
            this.eventEmitter.emit(ServerEvents.OpenSanctuaryDenied, {
                session,
                playerId,
                message: 'Vous ne pouvez pas utiliser cette action car vous avez atteint votre santé maximale',
            });
        } else if (object && this.gameCache.isPlaceableDisabled(session.id, position)) {
            this.eventEmitter.emit(ServerEvents.OpenSanctuaryDenied, {
                session,
                playerId,
                message: 'Vous ne pouvez pas utiliser cette action car ce sanctuaire a été utilisé récemment',
            });
        } else if (object && object.kind === kind) {
            this.eventEmitter.emit(ServerEvents.OpenSanctuary, {
                session,
                playerId,
                kind: object.kind,
                x: position.x,
                y: position.y,
            });
        }
    }

    performSanctuaryAction(session: InGameSession, playerId: string, position: Position, double: boolean = false): void {
        const object = this.gameCache.getPlaceableAtPosition(session.id, position);
        if (!object) throw new NotFoundException('Object not fou1nd');
        if (object.kind !== PlaceableKind.HEAL && object.kind !== PlaceableKind.FIGHT) throw new BadRequestException('Invalid object');

        switch (object.kind) {
            case PlaceableKind.HEAL:
                this.healSanctuary(session, playerId, object.kind, position, double);
                break;
            case PlaceableKind.FIGHT:
                this.fightSanctuary(session, playerId, object.kind, position, double);
                break;
        }
    }

    boardBoat(session: InGameSession, playerId: string, position: Position): void {
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (player.onBoatId) throw new BadRequestException('Player is already on a boat');
        const boat = this.gameCache.getPlaceableAtPosition(session.id, position);
        if (!boat || boat.kind !== PlaceableKind.BOAT) throw new NotFoundException('Boat not found');
        player.onBoatId = boat._id.toString();
        if (boat.x !== player.x || boat.y !== player.y) {
            this.sessionRepository.movePlayerPosition(session.id, playerId, boat.x, boat.y, 0);
        }
        this.sessionRepository.applyPlayerBoatSpeedBonus(session.id, playerId);
        this.movementService.calculateReachableTiles(session, playerId);
        this.eventEmitter.emit(ServerEvents.PlayerBoardedBoat, { session, playerId, boatId: player.onBoatId });
    }

    disembarkBoat(session: InGameSession, playerId: string, position: Position): void {
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (!player.onBoatId) throw new BadRequestException('Player is not on a boat');
        this.movementService.disembarkBoat(session, playerId, position);
        this.movementService.calculateReachableTiles(session, playerId);
        this.eventEmitter.emit(ServerEvents.PlayerDisembarkedBoat, { session, playerId });
    }

    private healSanctuary(session: InGameSession, playerId: string, kind: PlaceableKind, pos: Position, double: boolean = false): void {
        const player = this.validateSanctuaryAction(session, playerId, double);
        if (!player) return;
        const HEALTH_BONUS = 2;
        const addedHealth = double ? HEALTH_BONUS * 2 : HEALTH_BONUS;
        this.eventEmitter.emit(ServerEvents.SanctuaryActionSuccess, {
            session,
            playerId,
            kind,
            x: pos.x,
            y: pos.y,
            addedHealth,
            addedDefense: undefined,
            addedAttack: undefined,
        });
        this.sessionRepository.increasePlayerHealth(session.id, playerId, addedHealth);
        this.gameCache.disablePlaceable(session.id, pos, playerId);
    }

    private fightSanctuary(session: InGameSession, playerId: string, kind: PlaceableKind, pos: Position, double: boolean = false): void {
        const player = this.validateSanctuaryAction(session, playerId, double);
        if (!player) return;
        const bonus = double ? 2 : 1;
        this.eventEmitter.emit(ServerEvents.SanctuaryActionSuccess, {
            session,
            playerId,
            kind,
            x: pos.x,
            y: pos.y,
            addedHealth: undefined,
            addedDefense: bonus,
            addedAttack: bonus,
        });
        this.sessionRepository.applyPlayerBonus(session.id, playerId, bonus);
        this.gameCache.disablePlaceable(session.id, pos, playerId);
    }

    private validateSanctuaryAction(session: InGameSession, playerId: string, double: boolean): Player | null {
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (double && Math.random() > 1 / 2) {
            this.eventEmitter.emit(ServerEvents.SanctuaryActionFailed, { session, playerId });
            return null;
        }
        return player;
    }

    calculateAvailableActions(session: InGameSession, playerId: string): AvailableAction[] {
        const player = session.inGamePlayers[playerId];
        if (!player || player.actionsRemaining === 0) return [];

        const actions: AvailableAction[] = [];
        const orientations = [Orientation.N, Orientation.E, Orientation.S, Orientation.W];

        for (const orientation of orientations) {
            try {
                const pos = this.gameCache.getNextPosition(session.id, { x: player.x, y: player.y }, orientation);
                this.processPositionActions(actions, session, playerId, player, pos);
            } catch {
                continue;
            }
        }

        try {
            this.processPositionActions(actions, session, playerId, player, { x: player.x, y: player.y });
        } catch {
            // Ignore errors for current position
        }

        this.eventEmitter.emit(ServerEvents.PlayerAvailableActions, { session, playerId, actions });
        return actions;
    }

    private processPositionActions(actions: AvailableAction[], session: InGameSession, playerId: string, player: Player, pos: Position): void {
        const occupantId = this.gameCache.getTileOccupant(session.id, pos);
        const tile = this.gameCache.getTileAtPosition(session.id, pos);
        const object = this.gameCache.getPlaceableAtPosition(session.id, pos);

        this.addAttackAction(actions, occupantId, playerId, pos, session);
        this.addTransferFlagAction(actions, occupantId, playerId, pos, session);
        this.addDoorAction(actions, tile, pos);
        this.addPlaceableActions(actions, object, pos);
        this.addDisembarkAction(actions, player, tile, occupantId, pos);
    }

    private addAttackAction(actions: AvailableAction[], occupantId: string | null, playerId: string, pos: Position, session: InGameSession): void {
        if (!occupantId || occupantId === playerId) return;
        const attacker = session.inGamePlayers[playerId];
        const defender = session.inGamePlayers[occupantId];
        if (!attacker || !defender) return;
        if (session.mode === GameMode.CTF && attacker.teamNumber === defender.teamNumber) return;
        actions.push({ type: AvailableActionType.ATTACK, x: pos.x, y: pos.y });
    }

    private addTransferFlagAction(
        actions: AvailableAction[],
        occupantId: string | null,
        playerId: string,
        pos: Position,
        session: InGameSession,
    ): void {
        if (session.mode !== GameMode.CTF || !session.flagData || session.flagData.holderPlayerId !== playerId) return;
        if (!occupantId || occupantId === playerId) return;
        const holder = session.inGamePlayers[playerId];
        const teammate = session.inGamePlayers[occupantId];
        if (holder?.teamNumber && teammate?.teamNumber && holder.teamNumber === teammate.teamNumber) {
            actions.push({ type: AvailableActionType.TRANSFER_FLAG, x: pos.x, y: pos.y });
        }
    }

    private addDoorAction(actions: AvailableAction[], tile: Tile | null, pos: Position): void {
        if (tile && tile.kind === TileKind.DOOR) {
            actions.push({ type: AvailableActionType.DOOR, x: pos.x, y: pos.y });
        }
    }

    private addPlaceableActions(actions: AvailableAction[], object: Placeable | null, pos: Position): void {
        if (!object) return;
        if (object.kind === PlaceableKind.HEAL) actions.push({ type: AvailableActionType.HEAL, x: pos.x, y: pos.y });
        if (object.kind === PlaceableKind.FIGHT) actions.push({ type: AvailableActionType.FIGHT, x: pos.x, y: pos.y });
        if (object.kind === PlaceableKind.BOAT) actions.push({ type: AvailableActionType.BOAT, x: pos.x, y: pos.y });
    }

    private addDisembarkAction(actions: AvailableAction[], player: Player, tile: Tile | null, occupantId: string | null, pos: Position): void {
        if (!player.onBoatId) return;

        const canDisembark =
            tile &&
            !occupantId &&
            (tile.kind === TileKind.BASE ||
                tile.kind === TileKind.WATER ||
                tile.kind === TileKind.TELEPORT ||
                (tile.kind === TileKind.DOOR && tile.open));

        if (canDisembark) {
            actions.push({ type: AvailableActionType.BOAT, x: pos.x, y: pos.y });
        }
    }

    movePlayer(session: InGameSession, playerId: string, orientation: Orientation): number {
        return this.movementService.movePlayer(session, playerId, orientation);
    }

    calculateReachableTiles(session: InGameSession, playerId: string): ReachableTile[] {
        return this.movementService.calculateReachableTiles(session, playerId);
    }

    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<Game> {
        return await this.gameCache.fetchAndCacheGame(sessionId, gameId);
    }

    getInitialFlagData(sessionId: string): FlagData | undefined {
        return this.gameCache.getInitialFlagData(sessionId);
    }

    isTileFree(sessionId: string, position: Position): boolean {
        return this.gameCache.isTileFree(sessionId, position);
    }

    clearSessionGameCache(sessionId: string): void {
        this.gameCache.clearSessionGameCache(sessionId);
    }

    clearActiveCombatForSession(sessionId: string): void {
        this.combatService.clearActiveCombatForSession(sessionId);
    }

    selectCombatPosture(sessionId: string, playerId: string, posture: CombatPosture): void {
        this.combatService.combatChoice(sessionId, playerId, posture);
    }

    getActiveCombat(sessionId: string): ActiveCombat | null {
        return this.combatService.getActiveCombat(sessionId);
    }

    calculateDirectionToTarget(currentPlayer: Position, targetPlayer: Position): Orientation {
        const dx = targetPlayer.x - currentPlayer.x;
        const dy = targetPlayer.y - currentPlayer.y;
        if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? Orientation.E : Orientation.W;
        return dy > 0 ? Orientation.S : Orientation.N;
    }

    attackPlayer(sessionId: string, playerId: string, targetPosition: Position): void {
        this.combatService.attackPlayerAction(sessionId, playerId, targetPosition);
    }
}
