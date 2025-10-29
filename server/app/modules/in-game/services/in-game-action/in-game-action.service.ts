import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { TileKind } from '@common/enums/tile-kind.enum';
import { InGameSession } from '@common/models/session.interface';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InGameActionService {
    constructor(
        private readonly gameCache: GameCacheService,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    toggleDoor(session: InGameSession, playerId: string, x: number, y: number): void {
        const gameMap = this.gameCache.getGameMapForSession(session.id);
        const tile = gameMap.tiles.find(t => t.x === x && t.y === y);
        
        if (tile && tile.kind === TileKind.DOOR) {
            tile.open = !tile.open;
            
            this.eventEmitter.emit('door.toggled', {
                session,
                playerId,
                x,
                y,
                isOpen: tile.open
            });
        }
    }
}
