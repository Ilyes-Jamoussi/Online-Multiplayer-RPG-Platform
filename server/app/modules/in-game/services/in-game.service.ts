import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { WaitingRoomSession, InGameSession } from '@common/models/session.interface';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { TurnEngineService } from './turn-engine.service';
import { GameCacheService } from './game-cache.service';
import { InGameInitializationService } from './in-game-initialization.service';
import { InGameSessionRepository } from './in-game-session.repository';
import { InGameMovementService } from './in-game-movement.service';
import { Orientation } from '@common/enums/orientation.enum';
import { InGamePlayer } from '@common/models/player.interface';

@Injectable()
export class InGameService {
    constructor(
        private readonly turnEngine: TurnEngineService,
        private readonly gameCache: GameCacheService,
        private readonly initialization: InGameInitializationService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly movementService: InGameMovementService,
    ) {}

    async createInGameSession(waiting: WaitingRoomSession, mode: GameMode, mapSize: MapSize): Promise<InGameSession> {
        const { id, gameId, maxPlayers, players } = waiting;

        const session: InGameSession = {
            id,
            inGameId: `${id}-${gameId}`,
            gameId,
            maxPlayers,
            isGameStarted: false,
            inGamePlayers: {},
            currentTurn: { turnNumber: 1, activePlayerId: '' },
            startPoints: [],
            mapSize,
            mode,
            turnOrder: [],
        };

        const game = await this.gameCache.fetchAndCacheGame(id, gameId);

        const playerIdsOrder = this.initialization.makeTurnOrder(players);
        session.turnOrder = playerIdsOrder;

        session.inGamePlayers = Object.fromEntries(players.map((p) => [p.id, { ...p, x: 0, y: 0, startPointId: '', joined: false }]));

        const firstPlayerId = playerIdsOrder[0];
        session.currentTurn.activePlayerId = firstPlayerId;
        if (session.inGamePlayers[firstPlayerId]) {
            session.inGamePlayers[firstPlayerId].movementPoints = session.inGamePlayers[firstPlayerId].speed;
        }

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
        if (player.isInGame) throw new BadRequestException('Player already joined');
        player.isInGame = true;
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

    movePlayer(sessionId: string, playerId: string, orientation: Orientation): void {
        const session = this.sessionRepository.findById(sessionId);
        if (playerId !== session.currentTurn.activePlayerId) throw new BadRequestException('Not your turn');
        this.movementService.movePlayer(session, playerId, orientation);
    }

    leaveInGameSession(sessionId: string, playerId: string): { session: InGameSession; playerName: string; sessionEnded: boolean } {
        const player = this.sessionRepository.playerLeave(sessionId, playerId);
        const session = this.sessionRepository.findById(sessionId);
        const inGamePlayers = this.sessionRepository.inGamePlayersCount(sessionId);
        let sessionEnded = false;
        if (inGamePlayers < 2) {
            this.turnEngine.forceStopTimer(sessionId);
            sessionEnded = true;
        }

        return { session, playerName: player.name, sessionEnded };
    }

    getInGamePlayers(sessionId: string): InGamePlayer[] {
        return this.sessionRepository.getIngamePlayers(sessionId);
    }

    findSessionByPlayerId(playerId: string): InGameSession | null {
        return this.sessionRepository.findSessionByPlayerId(playerId);
    }
}
