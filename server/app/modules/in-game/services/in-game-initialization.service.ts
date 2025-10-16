import { Injectable } from '@nestjs/common';
import { InGameSession } from '@common/models/session.interface';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';

@Injectable()
export class InGameInitializationService {
    shuffleArray<T>(arr: T[]): T[] {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    assignStartPoints(session: InGameSession, game: Game): void {
        const shuffledStartPoints = this.shuffleArray(game.objects.filter((o) => o.kind === PlaceableKind.START));
        session.startPoints = session.turnOrderPlayerId.map((playerId, index) => {
            const startPoint = shuffledStartPoints[index];
            const player = session.inGamePlayers[playerId];
            player.x = startPoint.x;
            player.y = startPoint.y;
            player.startPointId = startPoint._id.toString();

            return {
                id: startPoint._id.toString(),
                playerId,
                x: startPoint.x,
                y: startPoint.y,
            };
        });
    }
}
