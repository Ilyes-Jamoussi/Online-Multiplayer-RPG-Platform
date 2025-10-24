import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Game, GameDocument } from '@app/modules/game-store/entities/game.entity';
import { Model } from 'mongoose';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Orientation } from '@common/enums/orientation.enum';

interface GameMap {
    tiles: Tile[];
    objects: Placeable[];
}
@Injectable()
export class GameCacheService {
    private readonly sessionsGames = new Map<string, Game>();
    private readonly sessionsGameMaps = new Map<string, GameMap>();

    constructor(@InjectModel(Game.name) private readonly gameModel: Model<GameDocument>) {}

    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<Game> {
        const game = await this.gameModel.findById(gameId).lean();
        if (!game) throw new NotFoundException('Game not found');
        this.sessionsGames.set(sessionId, game);
        this.sessionsGameMaps.set(sessionId, { tiles: game.tiles, objects: game.objects });
        return game;
    }

    getGameForSession(sessionId: string): Game {
        const game = this.sessionsGames.get(sessionId);
        if (!game) throw new NotFoundException('Game not found');
        return game;
    }

    clearGameCache(sessionId: string): void {
        this.sessionsGames.delete(sessionId);
    }

    getTileAtPosition(sessionId: string, x: number, y: number): Tile | undefined {
        const game = this.getGameForSession(sessionId);
        const { tiles, size: mapSize } = game;
        const index = y * mapSize + x;
        return tiles[index];
    }

    getNextPosition(sessionId: string, currentX: number, currentY: number, orientation: Orientation): { x: number; y: number } {
        const game = this.getGameForSession(sessionId);
        const { size: mapSize } = game;
        if (currentX < 0 || currentX >= mapSize || currentY < 0 || currentY >= mapSize) {
            throw new BadRequestException('Invalid position');
        }
        switch (orientation) {
            case Orientation.N:
                return { x: currentX, y: currentY - 1 };
            case Orientation.E:
                return { x: currentX + 1, y: currentY };
            case Orientation.S:
                return { x: currentX, y: currentY + 1 };
            case Orientation.W:
                return { x: currentX - 1, y: currentY };
        }
    }
}
