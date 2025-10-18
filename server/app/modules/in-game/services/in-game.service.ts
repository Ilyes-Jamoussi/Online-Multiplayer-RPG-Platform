import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { WaitingRoomSession, InGameSession } from '@common/models/session.interface';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { TurnEngineService } from './turn-engine.service';
import { GameCacheService } from './game-cache.service';
import { InGameInitializationService } from './in-game-initialization.service';
import { InGameSessionRepository } from './in-game-session.repository';

@Injectable()
export class InGameService {
    constructor(
        private readonly turnEngine: TurnEngineService,
        private readonly gameCache: GameCacheService,
        private readonly initialization: InGameInitializationService,
        private readonly sessionRepository: InGameSessionRepository,
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

        const game = await this.gameCache.fetchAndCacheGame(session.id, waiting.gameId);

        const order = waiting.players.map((p) => p.id);

        session.turnOrderPlayerId = this.initialization.shuffleArray(order);
        session.inGamePlayers = Object.fromEntries(waiting.players.map((p) => [p.id, { ...p, x: 0, y: 0, startPointId: '', joined: false }]));
        session.currentTurn.activePlayerId = session.turnOrderPlayerId[0];
        this.initialization.assignStartPoints(session, game);
        this.sessionRepository.save(session);
        return session;
    }

    startSession(sessionId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        if (session.isGameStarted) throw new BadRequestException('Game already started');

        session.isGameStarted = true;
        session.currentTurn = this.turnEngine.startFirstTurn(session, DEFAULT_TURN_DURATION);

        return session;
    }

    getSession(sessionId: string): InGameSession | undefined {
        return this.sessionRepository.findById(sessionId);
    }

    removeSession(sessionId: string): void {
        this.sessionRepository.delete(sessionId);
        this.gameCache.clearGameCache(sessionId);
    }

    updateSession(session: InGameSession): void {
        this.sessionRepository.update(session);
    }

    joinInGameSession(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.joined) throw new BadRequestException('Player already joined');
        player.joined = true;
        return session;
    }

    leaveInGameSession(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (!player.joined) throw new BadRequestException('Player not joined');
        player.joined = false;

        const joinedPlayers = Object.values(session.inGamePlayers).filter((p) => p.joined);
        if (joinedPlayers.length < 2) {
            this.turnEngine.forceStopTimer(sessionId);
        }

        return session;
    }

    endPlayerTurn(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        if (session.currentTurn.activePlayerId !== playerId) {
            throw new BadRequestException('Not your turn');
        }
        this.turnEngine.endTurnManual(session);
        return session;
    }

    abandonGame(sessionId: string, playerId: string): { session: InGameSession; playerName: string } {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        
        const playerName = player.name;
        player.joined = false;

        const joinedPlayers = Object.values(session.inGamePlayers).filter((p) => p.joined);
        if (joinedPlayers.length < 2) {
            this.turnEngine.forceStopTimer(sessionId);
        }

        return { session, playerName };
    }
}
