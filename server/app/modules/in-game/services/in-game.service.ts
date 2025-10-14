import { Injectable, Logger } from '@nestjs/common';
import { WaitingRoomSession, InGameSession } from '@common/models/session.interface';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { DEFAULT_TURN_DURATION, ARRAY_SHUFFLE_FACTOR } from '@common/constants/in-game';
import { TurnEngineService } from './turn-engine.service';
import { InjectModel } from '@nestjs/mongoose';
import { Game, GameDocument } from '@app/modules/game-store/entities/game.entity';
import { Model } from 'mongoose';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';

@Injectable()
export class InGameService {
    private readonly logger = new Logger(InGameService.name);
    private readonly sessions = new Map<string, InGameSession>();
    private readonly sessionsGames = new Map<string, Game>();

    constructor(
        private readonly turnEngine: TurnEngineService,
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    ) {}

    async createInGameSession(waiting: WaitingRoomSession, mode: GameMode, mapSize: MapSize): Promise<InGameSession> {
        const session: InGameSession = {
            id: waiting.id,
            inGameId: `${waiting.id}-${waiting.gameId}`,
            gameId: waiting.gameId,
            maxPlayers: waiting.maxPlayers,
            isGameStarted: false,
            inGamePlayers: {},
            currentTurn: { turnNumber: 1, activePlayerId: `` },
            startPoints: [],
            mapSize,
            mode,
            turnOrderPlayerId: [],
        };

        const game = await this.gameModel.findById(waiting.gameId).lean();
        if (!game) throw new Error('Game not found');
        this.sessionsGames.set(session.id, game);

        const order = waiting.players.map((p) => p.id);

        session.turnOrderPlayerId = this.shuffleArray(order);
        session.inGamePlayers = Object.fromEntries(waiting.players.map((p) => [p.id, { ...p, x: 0, y: 0, startPointId: '', joined: false }]));
        session.currentTurn.activePlayerId = session.turnOrderPlayerId[0];
        this.assignStartPoints(session);
        this.sessions.set(session.id, session);
        return session;
    }

    startSession(sessionId: string): InGameSession {
        const session = this.getSessionSafe(sessionId);
        if (session.isGameStarted) throw new Error('GAME_ALREADY_STARTED');

        session.isGameStarted = true;
        session.currentTurn = this.turnEngine.startFirstTurn(session, DEFAULT_TURN_DURATION);

        return session;
    }

    getSession(sessionId: string): InGameSession | undefined {
        return this.getSessionSafe(sessionId);
    }

    removeSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        this.logger.warn(`Session ${sessionId} supprimée`);
    }

    updateSession(session: InGameSession): void {
        this.sessions.set(session.id, session);
    }

    joinInGameSession(sessionId: string, playerId: string): InGameSession {
        const session = this.getSessionSafe(sessionId);
        const player = session.inGamePlayers[playerId];
        this.logger.log(`Player ${playerId} joined session ${sessionId}`);
        if (!player) throw new Error('Player not found');
        this.logger.log(`Player ${playerId} found in session ${sessionId}`);
        if (player.joined) throw new Error('Player already joined');
        this.logger.log(`Player ${playerId} joined session ${sessionId}`);
        player.joined = true;
        return session;
    }

    leaveInGameSession(sessionId: string, playerId: string): InGameSession {
        const session = this.getSessionSafe(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new Error('Player not found');
        if (!player.joined) throw new Error('Player not joined');
        player.joined = false;

        const joinedPlayers = Object.values(session.inGamePlayers).filter((p) => p.joined);
        if (joinedPlayers.length < 2) {
            this.logger.warn(`Session ${sessionId} has less than 2 players, stopping timer`);
            this.turnEngine.forceStopTimer(sessionId);
        }

        return session;
    }

    private shuffleArray<T>(arr: T[]): T[] {
        return [...arr].sort(() => Math.random() - ARRAY_SHUFFLE_FACTOR);
    }

    private getSessionSafe(sessionId: string): InGameSession {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');
        return session;
    }

    private assignStartPoints(session: InGameSession): void {
        const game = this.sessionsGames.get(session.id);
        if (!game) throw new Error('Game not found');
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
