import { Injectable } from '@nestjs/common';
import { InGameSession } from '@common/models/session.interface';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { InGamePlayer } from '@common/models/player.interface';

@Injectable()
export class InGameInitializationService {
    makeTurnOrder(players: InGamePlayer[]): string[] {
        const sortedPlayers = [...players].sort((a, b) => b.speed - a.speed);
        const uniqueSpeeds = Array.from(new Set(sortedPlayers.map((p) => p.speed)));
        const orderedPlayerIds: string[] = [];

        for (const speed of uniqueSpeeds) {
            const playerIdsAtSpeed = sortedPlayers.filter((p) => p.speed === speed).map((p) => p.id);
            orderedPlayerIds.push(...this.shuffleArray(playerIdsAtSpeed));
        }

        return orderedPlayerIds;
    }

    assignStartPoints(session: InGameSession, game: Game): void {
        const shuffledStartPoints = this.shuffleArray(game.objects.filter((o) => o.kind === PlaceableKind.START));

        if (shuffledStartPoints.length < session.turnOrder.length) {
            throw new Error(`Pas assez de points de départ sur la carte :
                ${shuffledStartPoints.length} points pour ${session.turnOrder.length} joueurs`);
        }

        session.startPoints = session.turnOrder.map((playerId, index) => {
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

    shuffleArray<T>(arr: T[]): T[] {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
