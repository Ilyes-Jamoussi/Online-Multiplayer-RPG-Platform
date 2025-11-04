import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { Orientation } from '@common/enums/orientation.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InGameActionService {
    constructor(
        private readonly gameCache: GameCacheService,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    attackPlayer(session: InGameSession, playerId: string, x: number, y: number): void {
        const targetPlayerId = this.gameCache.getTileOccupant(session.id, x, y);
        if (!targetPlayerId) throw new NotFoundException('Target player not found');
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
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

        this.eventEmitter.emit('player.availableActions', {
            session,
            playerId,
            actions,
        });

        return actions;
    }
}
