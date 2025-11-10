import { ServerEvents } from '@app/enums/server-events.enum';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { MovementService } from '@app/modules/in-game/services/movement/movement.service';
import { Orientation } from '@common/enums/orientation.enum';
import { TileKind } from '@common/enums/tile.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ActionService {
    constructor(
        private readonly gameCache: GameCacheService,
        private readonly movementService: MovementService,
        private readonly combatService: CombatService,
        private readonly eventEmitter: EventEmitter2,
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
                    if (occupantId && occupantId !== playerId) {
                        actions.push({ type: 'ATTACK', x: pos.x, y: pos.y });
                    }

                    const tile = this.gameCache.getTileAtPosition(session.id, pos.x, pos.y);
                    if (tile && tile.kind === 'DOOR') {
                        actions.push({ type: 'DOOR', x: pos.x, y: pos.y });
                    }
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

    // Movement delegation
    movePlayer(session: InGameSession, playerId: string, orientation: Orientation): number {
        return this.movementService.movePlayer(session, playerId, orientation);
    }

    calculateReachableTiles(session: InGameSession, playerId: string): ReachableTile[] {
        return this.movementService.calculateReachableTiles(session, playerId);
    }

    // GameCache delegation
    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<any> {
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
}
