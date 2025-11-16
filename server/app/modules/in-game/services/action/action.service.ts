import { ServerEvents } from '@app/enums/server-events.enum';
import { ActiveCombat } from '@app/interfaces/active-combat.interface';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { MovementService } from '@app/modules/in-game/services/movement/movement.service';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ActionService {
    constructor(
        private readonly gameCache: GameCacheService,
        private readonly movementService: MovementService,
        private readonly combatService: CombatService,
        private readonly eventEmitter: EventEmitter2,
        private readonly sessionRepository: InGameSessionRepository,
    ) {}

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
        if (!boat) throw new NotFoundException('Boat not found');
        if (boat.kind !== PlaceableKind.BOAT) throw new BadRequestException('Invalid boat');
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
        player.onBoatId = undefined;
        if (position.x !== player.x || position.y !== player.y) {
            this.sessionRepository.movePlayerPosition(session.id, playerId, position.x, position.y, 0);
        }
        this.sessionRepository.resetPlayerBoatSpeedBonus(session.id, playerId);
        this.movementService.calculateReachableTiles(session, playerId);
        this.eventEmitter.emit(ServerEvents.PlayerDisembarkedBoat, { session, playerId });
    }

    private healSanctuary(session: InGameSession, playerId: string, kind: PlaceableKind, pos: Position, double: boolean = false): void {
        const { x, y } = pos;
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (double && Math.random() > 1 / 2) {
            this.eventEmitter.emit(ServerEvents.SanctuaryActionFailed, {
                session,
                playerId,
            });
            return;
        }
        const addedHealth = double ? 2 * 2 : 2;
        this.eventEmitter.emit(ServerEvents.SanctuaryActionSuccess, {
            session,
            playerId,
            kind,
            x,
            y,
            addedHealth,
            addedDefense: undefined,
            addedAttack: undefined,
        });
        this.sessionRepository.increasePlayerHealth(session.id, playerId, addedHealth);
        this.gameCache.disablePlaceable(session.id, pos, playerId);
    }

    private fightSanctuary(session: InGameSession, playerId: string, kind: PlaceableKind, pos: Position, double: boolean = false): void {
        const { x, y } = pos;
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (double && Math.random() > 1 / 2) {
            this.eventEmitter.emit(ServerEvents.SanctuaryActionFailed, {
                session,
                playerId,
            });
            return;
        }
        const bonus = double ? 2 : 1;
        this.eventEmitter.emit(ServerEvents.SanctuaryActionSuccess, {
            session,
            playerId,
            kind,
            x,
            y,
            addedHealth: undefined,
            addedDefense: bonus,
            addedAttack: bonus,
        });

        this.sessionRepository.applyPlayerBonus(session.id, playerId, bonus);
        this.gameCache.disablePlaceable(session.id, pos, playerId);
    }

    calculateAvailableActions(session: InGameSession, playerId: string): AvailableAction[] {
        const player = session.inGamePlayers[playerId];
        if (!player) return [];

        const actions: AvailableAction[] = [];
        const orientations = [Orientation.N, Orientation.E, Orientation.S, Orientation.W];

        if (player.actionsRemaining > 0) {
            for (const orientation of orientations) {
                try {
                    const pos = this.gameCache.getNextPosition(session.id, { x: player.x, y: player.y }, orientation);
                    const occupantId = this.gameCache.getTileOccupant(session.id, pos);
                    const tile = this.gameCache.getTileAtPosition(session.id, pos);
                    const object = this.gameCache.getPlaceableAtPosition(session.id, pos);

                    this.addAttackAction(actions, occupantId, playerId, pos);
                    this.addDoorAction(actions, tile, pos);
                    this.addPlaceableActions(actions, object, pos);
                    this.addDisembarkAction(actions, player, tile, occupantId, pos);
                } catch {
                    continue;
                }
            }

            try {
                const currentPos = { x: player.x, y: player.y };
                const currentOccupantId = this.gameCache.getTileOccupant(session.id, currentPos);
                const currentTile = this.gameCache.getTileAtPosition(session.id, currentPos);
                const currentObject = this.gameCache.getPlaceableAtPosition(session.id, currentPos);

                this.addDoorAction(actions, currentTile, currentPos);
                this.addPlaceableActions(actions, currentObject, currentPos);
                this.addDisembarkAction(actions, player, currentTile, currentOccupantId, currentPos);
            } catch {
                return;
            }
        }

        this.eventEmitter.emit(ServerEvents.PlayerAvailableActions, {
            session,
            playerId,
            actions,
        });

        return actions;
    }

    private addAttackAction(actions: AvailableAction[], occupantId: string | null, playerId: string, pos: Position): void {
        if (occupantId && occupantId !== playerId) {
            actions.push({ type: AvailableActionType.ATTACK, x: pos.x, y: pos.y });
        }
    }

    private addDoorAction(actions: AvailableAction[], tile: Tile | null, pos: Position): void {
        if (tile && tile.kind === TileKind.DOOR) {
            actions.push({ type: AvailableActionType.DOOR, x: pos.x, y: pos.y });
        }
    }

    private addPlaceableActions(actions: AvailableAction[], object: Placeable | null, pos: Position): void {
        if (!object) return;

        if (object.kind === PlaceableKind.HEAL) {
            actions.push({ type: AvailableActionType.HEAL, x: pos.x, y: pos.y });
        }

        if (object.kind === PlaceableKind.FIGHT) {
            actions.push({ type: AvailableActionType.FIGHT, x: pos.x, y: pos.y });
        }

        if (object.kind === PlaceableKind.BOAT) {
            actions.push({ type: AvailableActionType.BOAT, x: pos.x, y: pos.y });
        }
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

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? Orientation.E : Orientation.W;
        } else {
            return dy > 0 ? Orientation.S : Orientation.N;
        }
    }

    attackPlayer(sessionId: string, playerId: string, targetPosition: Position): void {
        this.combatService.attackPlayerAction(sessionId, playerId, targetPosition);
    }
}
