import { ServerEvents } from '@app/enums/server-events.enum';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { MovementService } from '@app/modules/in-game/services/movement/movement.service';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
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

    toggleDoor(session: InGameSession, playerId: string, x: number, y: number): void {
        const gameMap = this.gameCache.getGameMapForSession(session.id);
        const tile = gameMap.tiles.find((t) => t.x === x && t.y === y);

        if (tile && tile.kind === TileKind.DOOR) {
            tile.open = !tile.open;

            this.eventEmitter.emit(ServerEvents.DoorToggled, {
                session,
                playerId,
                x,
                y,
                isOpen: tile.open,
            });
        }
    }

    sanctuaryRequest(session: InGameSession, playerId: string, x: number, y: number, kind: PlaceableKind.HEAL | PlaceableKind.FIGHT): void {
        const object = this.gameCache.getPlaceableAtPosition(session.id, x, y);
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
        } else if (object && this.gameCache.isPlaceableDisabled(session.id, x, y)) {
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
                x,
                y,
            });
        }
    }

    performSanctuaryAction(session: InGameSession, playerId: string, x: number, y: number, double: boolean = false): void {
        const object = this.gameCache.getPlaceableAtPosition(session.id, x, y);
        if (!object) throw new NotFoundException('Object not fou1nd');
        if (object.kind !== PlaceableKind.HEAL && object.kind !== PlaceableKind.FIGHT) throw new BadRequestException('Invalid object');

        switch (object.kind) {
            case PlaceableKind.HEAL:
                this.healSanctuary(session, playerId, object.kind, { x, y }, double);
                break;
            case PlaceableKind.FIGHT:
                this.fightSanctuary(session, playerId, object.kind, { x, y }, double);
                break;
        }
    }

    boardBoat(session: InGameSession, playerId: string, x: number, y: number): void {
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (player.onBoatId) throw new BadRequestException('Player is already on a boat');
        const boat = this.gameCache.getPlaceableAtPosition(session.id, x, y);
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

    disembarkBoat(session: InGameSession, playerId: string, x: number, y: number): void {
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        if (!player.onBoatId) throw new BadRequestException('Player is not on a boat');
        player.onBoatId = undefined;
        if (x !== player.x || y !== player.y) {
            this.sessionRepository.movePlayerPosition(session.id, playerId, x, y, 0);
        }
        this.sessionRepository.resetPlayerBoatSpeedBonus(session.id, playerId);
        this.movementService.calculateReachableTiles(session, playerId);
        this.eventEmitter.emit(ServerEvents.PlayerDisembarkedBoat, { session, playerId });
    }

    private healSanctuary(
        session: InGameSession,
        playerId: string,
        kind: PlaceableKind,
        pos: { x: number; y: number },
        double: boolean = false,
    ): void {
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
        this.gameCache.disablePlaceable(session.id, x, y, playerId);
    }

    private fightSanctuary(
        session: InGameSession,
        playerId: string,
        kind: PlaceableKind,
        pos: { x: number; y: number },
        double: boolean = false,
    ): void {
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
        this.gameCache.disablePlaceable(session.id, x, y, playerId);
    }

    calculateAvailableActions(session: InGameSession, playerId: string): AvailableAction[] {
        const player = session.inGamePlayers[playerId];
        if (!player) return [];

        const actions: AvailableAction[] = [];
        const orientations = [Orientation.N, Orientation.E, Orientation.S, Orientation.W];

        if (player.actionsRemaining > 0) {
            for (const orientation of orientations) {
                try {
                    const pos = this.gameCache.getNextPosition(session.id, player.x, player.y, orientation);
                    const occupantId = this.gameCache.getTileOccupant(session.id, pos.x, pos.y);
                    const tile = this.gameCache.getTileAtPosition(session.id, pos.x, pos.y);
                    const object = this.gameCache.getPlaceableAtPosition(session.id, pos.x, pos.y);

                    this.addAttackAction(actions, occupantId, playerId, pos);
                    this.addDoorAction(actions, tile, pos);
                    this.addPlaceableActions(actions, object, pos);
                    this.addDisembarkAction(actions, player, tile, occupantId, pos);
                } catch {
                    continue;
                }
            }
        }

        this.eventEmitter.emit(ServerEvents.PlayerAvailableActions, {
            session,
            playerId,
            actions,
        });

        return actions;
    }

    private addAttackAction(actions: AvailableAction[], occupantId: string | null, playerId: string, pos: { x: number; y: number }): void {
        if (occupantId && occupantId !== playerId) {
            actions.push({ type: 'ATTACK', x: pos.x, y: pos.y });
        }
    }

    private addDoorAction(actions: AvailableAction[], tile: { kind: string } | null, pos: { x: number; y: number }): void {
        if (tile && tile.kind === 'DOOR') {
            actions.push({ type: 'DOOR', x: pos.x, y: pos.y });
        }
    }

    private addPlaceableActions(actions: AvailableAction[], object: { kind: string } | null, pos: { x: number; y: number }): void {
        if (!object) return;

        if (object.kind === 'HEAL') {
            actions.push({ type: 'HEAL', x: pos.x, y: pos.y });
        }

        if (object.kind === 'FIGHT') {
            actions.push({ type: 'FIGHT', x: pos.x, y: pos.y });
        }

        if (object.kind === 'BOAT') {
            actions.push({ type: 'BOAT', x: pos.x, y: pos.y });
        }
    }

    private addDisembarkAction(
        actions: AvailableAction[],
        player: { onBoatId?: string },
        tile: { kind: string; open?: boolean } | null,
        occupantId: string | null,
        pos: { x: number; y: number },
    ): void {
        if (!player.onBoatId) return;

        const canDisembark =
            tile &&
            !occupantId &&
            (tile.kind === TileKind.BASE ||
                tile.kind === TileKind.WATER ||
                tile.kind === TileKind.TELEPORT ||
                (tile.kind === TileKind.DOOR && tile.open));

        if (canDisembark) {
            actions.push({ type: 'BOAT', x: pos.x, y: pos.y });
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

    isTileFree(sessionId: string, x: number, y: number): boolean {
        return this.gameCache.isTileFree(sessionId, x, y);
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

    getActiveCombat(sessionId: string): { playerAId: string; playerBId: string } | null {
        return this.combatService.getActiveCombat(sessionId);
    }

    calculateDirectionToTarget(currentPlayer: { x: number; y: number }, targetPlayer: { x: number; y: number }): Orientation {
        const dx = targetPlayer.x - currentPlayer.x;
        const dy = targetPlayer.y - currentPlayer.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? Orientation.E : Orientation.W;
        } else {
            return dy > 0 ? Orientation.S : Orientation.N;
        }
    }

    attackPlayer(sessionId: string, playerId: string, targetX: number, targetY: number): void {
        this.combatService.attackPlayerAction(sessionId, playerId, targetX, targetY);
    }
}
