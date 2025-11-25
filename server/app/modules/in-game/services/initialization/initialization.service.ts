import { Game } from '@app/modules/game-store/entities/game.entity';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InitializationService {
    constructor(private readonly gameCache: GameCacheService) {}
    makeTurnOrder(players: Player[]): string[] {
        const sortedPlayers = [...players].sort((a, b) => b.speed - a.speed);
        const uniqueSpeeds = Array.from(new Set(sortedPlayers.map((player) => player.speed)));
        const orderedPlayerIds: string[] = [];

        for (const speed of uniqueSpeeds) {
            const playerIdsAtSpeed = sortedPlayers.filter((player) => player.speed === speed).map((player) => player.id);
            orderedPlayerIds.push(...this.shuffleArray(playerIdsAtSpeed));
        }

        return orderedPlayerIds;
    }

    assignStartPoints(session: InGameSession, game: Game): void {
        const shuffledStartPoints = this.shuffleArray(game.objects.filter((object) => object.kind === PlaceableKind.START));

        if (shuffledStartPoints.length < session.turnOrder.length) {
            throw new Error(`Pas assez de points de départ sur la carte :
                ${shuffledStartPoints.length} points pour ${session.turnOrder.length} joueurs`);
        }

        session.startPoints = session.turnOrder.map((playerId, index) => {
            const startPoint = shuffledStartPoints[index];
            const player = session.inGamePlayers[playerId];
            player.startPointId = startPoint._id.toString();

            this.gameCache.setTileOccupant(session.id, { x: startPoint.x, y: startPoint.y }, player);
            player.x = startPoint.x;
            player.y = startPoint.y;

            return {
                id: startPoint._id.toString(),
                playerId,
                x: startPoint.x,
                y: startPoint.y,
            };
        });
    }

    private shuffleArray<T>(arr: T[]): T[] {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
