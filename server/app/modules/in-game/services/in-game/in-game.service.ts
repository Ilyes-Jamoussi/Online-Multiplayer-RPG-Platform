import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { InitializationService } from '@app/modules/in-game/services/initialization/initialization.service';
import { StatisticsService } from '@app/modules/in-game/services/statistics/statistics.service';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { GameMode } from '@common/enums/game-mode.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession, WaitingRoomSession } from '@common/interfaces/session.interface';
import { Team } from '@common/interfaces/team.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class InGameService {
    constructor(
        private readonly timerService: TimerService,
        private readonly initialization: InitializationService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly gameplayService: GameplayService,
        private readonly statisticsService: StatisticsService,
    ) {}

    async createInGameSession(waiting: WaitingRoomSession, mode: GameMode): Promise<InGameSession> {
        const { id, gameId, maxPlayers, players, chatId } = waiting;
        const isCtf = mode === GameMode.CTF;
        const game = await this.gameplayService.fetchAndCacheGame(id, gameId);

        const teams: Record<number, Team> = {};
        if (isCtf) {
            const teamCount = 2;
            for (let i = 0; i < teamCount; i++) {
                teams[i + 1] = { number: i + 1, playerIds: [] };
            }
        }

        const session: InGameSession = {
            id,
            playerCount: players.length,
            inGameId: `${id}-${gameId}`,
            gameId,
            maxPlayers,
            isGameStarted: false,
            inGamePlayers: {},
            currentTurn: { turnNumber: 1, activePlayerId: '', hasUsedAction: false },
            startPoints: [],
            mapSize: game.size,
            mode,
            turnOrder: [],
            isAdminModeActive: false,
            teams,
            flagData: isCtf ? this.gameplayService.getInitialFlagData(id) : undefined,
            chatId,
        };

        const totalDoors = game.tiles.filter((tile) => tile.kind === TileKind.DOOR).length;
        const totalSanctuaries = game.objects.filter((p) => p.kind === PlaceableKind.HEAL || p.kind === PlaceableKind.FIGHT).length;
        let totalTeleportTiles = 0;
        for (const channel of game.teleportChannels) {
            if (channel.tiles?.entryA) {
                totalTeleportTiles++;
            }
            if (channel.tiles?.entryB) {
                totalTeleportTiles++;
            }
        }
        this.statisticsService.initializeTracking(id, game.size, totalDoors, totalSanctuaries, totalTeleportTiles);

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

        Object.values(session.inGamePlayers).forEach((player) => {
            this.statisticsService.trackTileVisited(id, player.id, { x: player.x, y: player.y });
        });

        this.sessionRepository.save(session);

        const virtualPlayers = players.filter((player) => player.virtualPlayerType);
        for (const virtualPlayer of virtualPlayers) {
            this.joinInGameSession(session.id, virtualPlayer.id);
        }

        return session;
    }

    boardBoat(sessionId: string, playerId: string, position: Position): void {
        this.gameplayService.boardBoat(sessionId, playerId, position);
    }

    disembarkBoat(sessionId: string, playerId: string, position: Position): void {
        this.gameplayService.disembarkBoat(sessionId, playerId, position);
    }

    private startSessionWithTransition(sessionId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        if (session.isGameStarted) throw new BadRequestException('Game already started');

        session.isGameStarted = true;
        session.gameStartTime = new Date();
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

        if (session.mode === GameMode.CTF) {
            this.sessionRepository.assignPlayerToTeam(sessionId, playerId);
        }

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

    toggleDoorAction(sessionId: string, playerId: string, position: Position): void {
        this.gameplayService.toggleDoorAction(sessionId, playerId, position);
    }

    sanctuaryRequest(sessionId: string, playerId: string, position: Position, kind: PlaceableKind.HEAL | PlaceableKind.FIGHT): void {
        this.gameplayService.sanctuaryRequest(sessionId, playerId, position, kind);
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
        const realPlayers = this.sessionRepository.realPlayersCount(sessionId);
        let sessionEnded = false;

        if (inGamePlayers < 2 || !realPlayers) {
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

    teleportPlayer(sessionId: string, playerId: string, position: Position): void {
        this.gameplayService.teleportPlayer(sessionId, playerId, position);
    }

    removeSession(sessionId: string): void {
        this.sessionRepository.delete(sessionId);
        this.gameplayService.clearSessionResources(sessionId);
        this.timerService.clearTimerForSession(sessionId);
    }

    performSanctuaryAction(sessionId: string, playerId: string, position: Position, double: boolean = false): void {
        this.gameplayService.performSanctuaryAction(sessionId, playerId, position, double);
    }

    getGameStatistics(sessionId: string) {
        return this.statisticsService.getStoredGameStatistics(sessionId);
    }

    storeGameStatistics(sessionId: string, winnerId: string, winnerName: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const gameStartTime = session.gameStartTime || new Date();
        this.statisticsService.calculateAndStoreGameStatistics(session, winnerId, winnerName, gameStartTime);
    }

    pickUpFlag(sessionId: string, playerId: string): void {
        this.gameplayService.pickUpFlag(sessionId, playerId);
    }

    requestFlagTransfer(sessionId: string, playerId: string, position: Position): void {
        this.gameplayService.requestFlagTransfer(sessionId, playerId, position);
    }

    respondToFlagTransfer(sessionId: string, toPlayerId: string, fromPlayerId: string, accepted: boolean): void {
        this.gameplayService.respondToFlagTransfer(sessionId, toPlayerId, fromPlayerId, accepted);
    }
}
