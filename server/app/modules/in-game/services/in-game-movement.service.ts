import { InGameSession } from '@common/models/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GameCacheService } from './game-cache.service';
import { TileCost } from '@common/enums/tile-kind.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InGameMovementService {
    constructor(
        private readonly gameCache: GameCacheService,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    movePlayer(session: InGameSession, playerId: string, orientation: Orientation): void {
        const player = session.inGamePlayers[playerId];
        if (!player) {
            throw new NotFoundException('Player not found');
        }

        const { x: nextX, y: nextY } = this.gameCache.getNextPosition(session.id, player.x, player.y, orientation);
        const tile = this.gameCache.getTileAtPosition(session.id, nextX, nextY);
        if (!tile) {
            throw new NotFoundException('Tile not found');
        }

        const moveCost = TileCost[tile.kind];
        if (moveCost === -1) {
            throw new BadRequestException('Cannot move onto this tile');
        }
        else if (moveCost > player.movementPoints) {
            throw new BadRequestException('Not enough movement points for this tile');
        }

        player.x = nextX;
        player.y = nextY;
        player.movementPoints -= moveCost;

        this.eventEmitter.emit('player.moved', {
            session,
            playerId,
            x: nextX,
            y: nextY,
            movementPoints: player.movementPoints,
        });
    }
}
