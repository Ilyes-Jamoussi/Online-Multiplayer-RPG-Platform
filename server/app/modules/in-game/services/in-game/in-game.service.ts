import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { InitializationService } from '@app/modules/in-game/services/initialization/initialization.service';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { InGameSession, WaitingRoomSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class InGameService {
    constructor(
        private readonly timerService: TimerService,
        private readonly initialization: InitializationService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly gameplayService: GameplayService,
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
            currentTurn: { turnNumber: 1, activePlayerId: '', hasUsedAction: false },
            startPoints: [],
            mapSize,
            mode,
            turnOrder: [],
            isAdminModeActive: false,
        };

        const game = await this.gameplayService.fetchAndCacheGame(id, gameId);

        const playerIdsOrder = this.initialization.makeTurnOrder(players);
        session.turnOrder = playerIdsOrder;

        session.inGamePlayers = Object.fromEntries(players.map((player) => [player.id, { ...player, x: 0, y: 0, startPointId: '', joined: false }]));

        const firstPlayerId = playerIdsOrder[0];
        session.currentTurn.activePlayerId = firstPlayerId;
        if (session.inGamePlayers[firstPlayerId]) {
            const player = session.inGamePlayers[firstPlayerId];
            const newSpeed = player.baseSpeed + player.speedBonus;
            player.speed = newSpeed;
        }

        this.initialization.assignStartPoints(session, game);
        this.sessionRepository.save(session);

        // Auto-join virtual players
        const virtualPlayers = players.filter(player => player.virtualPlayerType);
        for (const virtualPlayer of virtualPlayers) {
            this.joinInGameSession(session.id, virtualPlayer.id);
        }

        return session;
    }

    private startSessionWithTransition(sessionId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        if (session.isGameStarted) throw new BadRequestException('Game already started');

        session.isGameStarted = true;
        session.currentTurn = this.timerService.startFirstTurnWithTransition(session, DEFAULT_TURN_DURATION);

        return session;
    }

    getSession(sessionId: string): InGameSession | undefined {
        return this.sessionRepository.findById(sessionId);
    }

    joinInGameSession(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.isInGame) throw new BadRequestException('Player already joined');

        this.sessionRepository.updatePlayer(sessionId, playerId, { isInGame: true });
        const updatedSession = this.sessionRepository.findById(sessionId);

        if (!updatedSession.isGameStarted) {
            const allPlayersJoined = Object.values(updatedSession.inGamePlayers).every((p) => p.isInGame);
            if (allPlayersJoined) {
                this.startSessionWithTransition(sessionId);
            }
        }

        return this.sessionRepository.findById(sessionId);
    }

    endPlayerTurn(sessionId: string, playerId: string): InGameSession {
        return this.gameplayService.endPlayerTurn(sessionId, playerId);
    }

    toggleDoorAction(sessionId: string, playerId: string, x: number, y: number): void {
        this.gameplayService.toggleDoorAction(sessionId, playerId, x, y);
    }

    movePlayer(sessionId: string, playerId: string, orientation: Orientation): void {
        this.gameplayService.movePlayer(sessionId, playerId, orientation);
    }

    leaveInGameSession(
        sessionId: string,
        playerId: string,
    ): {
        session: InGameSession;
        playerName: string;
        playerId: string;
        sessionEnded: boolean;
        adminModeDeactivated: boolean;
    } {
        const player = this.sessionRepository.playerLeave(sessionId, playerId);
        const session = this.sessionRepository.findById(sessionId);

        let adminModeDeactivated = false;
        if (player.isAdmin && session.isAdminModeActive) {
            session.isAdminModeActive = false;
            this.sessionRepository.update(session);
            adminModeDeactivated = true;
        }

        const inGamePlayers = this.sessionRepository.inGamePlayersCount(sessionId);
        let sessionEnded = false;
        if (inGamePlayers < 2) {
            this.timerService.forceStopTimer(sessionId);
            sessionEnded = true;
        } else if (playerId === session.currentTurn.activePlayerId) {
            this.timerService.endTurnManual(session);
        }

        return { session, playerName: player.name, playerId, sessionEnded, adminModeDeactivated };
    }

    findSessionByPlayerId(playerId: string): InGameSession | null {
        return this.sessionRepository.findSessionByPlayerId(playerId);
    }

    getReachableTiles(sessionId: string, playerId: string): void {
        this.gameplayService.getReachableTiles(sessionId, playerId);
    }

    getAvailableActions(sessionId: string, playerId: string) {
        return this.gameplayService.getAvailableActions(sessionId, playerId);
    }

    toggleAdminMode(sessionId: string, playerId: string): InGameSession {
        return this.gameplayService.toggleAdminMode(sessionId, playerId);
    }

    teleportPlayer(sessionId: string, playerId: string, x: number, y: number): void {
        this.gameplayService.teleportPlayer(sessionId, playerId, x, y);
    }

    removeSession(sessionId: string): void {
        this.sessionRepository.delete(sessionId);
        this.gameplayService.clearSessionResources(sessionId);
        this.timerService.clearTimerForSession(sessionId);
    }
}
