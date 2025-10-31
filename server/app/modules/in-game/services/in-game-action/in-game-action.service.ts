import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { Orientation } from '@common/enums/orientation.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { InGameSession } from '@common/models/session.interface';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InGameActionService {
    constructor(
        private readonly gameCache: GameCacheService,
        private readonly eventEmitter: EventEmitter2,
        private readonly combatService: CombatService,
    ) {}

    attackPlayer(session: InGameSession, playerId: string, x: number, y: number): void {
        const targetPlayer = Object.values(session.inGamePlayers).find((player) => player.x === x && player.y === y);

        if (targetPlayer) {
            this.combatService.startCombat(session, playerId, targetPlayer.id, x, y);
        }
    }

    toggleDoor(session: InGameSession, playerId: string, x: number, y: number): void {
        const gameMap = this.gameCache.getGameMapForSession(session.id);
        const tile = gameMap.tiles.find((t) => t.x === x && t.y === y);

        if (tile && tile.kind === TileKind.DOOR) {
            tile.open = !tile.open;

            this.eventEmitter.emit('door.toggled', {
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

        this.eventEmitter.emit('player.moved', { session, speed: player.speed, playerId, actions, x: player.x, y: player.y });
        return actions;
    }
}
