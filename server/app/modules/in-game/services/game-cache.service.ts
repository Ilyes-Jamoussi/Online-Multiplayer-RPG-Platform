import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Game, GameDocument } from '@app/modules/game-store/entities/game.entity';
import { Model } from 'mongoose';

@Injectable()
export class GameCacheService {
    private readonly sessionsGames = new Map<string, Game>();

    constructor(@InjectModel(Game.name) private readonly gameModel: Model<GameDocument>) {}

    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<Game> {
        const game = await this.gameModel.findById(gameId).lean();
        if (!game) throw new NotFoundException('Game not found');
        this.sessionsGames.set(sessionId, game);
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
}
