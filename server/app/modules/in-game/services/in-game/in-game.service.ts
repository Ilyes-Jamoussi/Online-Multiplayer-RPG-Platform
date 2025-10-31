import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { TurnTimerStates } from '@common/enums/turn-timer-states.enum';
import { Player } from '@common/models/player.interface';
import { InGameSession, WaitingRoomSession } from '@common/models/session.interface';
import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { GameCacheService } from 'app/modules/in-game/services/game-cache/game-cache.service';
import { InGameActionService } from 'app/modules/in-game/services/in-game-action/in-game-action.service';
import { InGameInitializationService } from 'app/modules/in-game/services/in-game-initialization/in-game-initialization.service';
import { InGameMovementService } from 'app/modules/in-game/services/in-game-movement/in-game-movement.service';

@Injectable()
export class InGameService {
    constructor(
        private readonly timerService: TimerService,
        private readonly gameCache: GameCacheService,
        private readonly initialization: InGameInitializationService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly movementService: InGameMovementService,
    ) {}

    @Inject(InGameActionService) private readonly actionService: InGameActionService;
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2;

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
        };

        const game = await this.gameCache.fetchAndCacheGame(id, gameId);

        const playerIdsOrder = this.initialization.makeTurnOrder(players);
        session.turnOrder = playerIdsOrder;

        session.inGamePlayers = Object.fromEntries(players.map((p) => [p.id, { ...p, x: 0, y: 0, startPointId: '', joined: false }]));

        const firstPlayerId = playerIdsOrder[0];
        session.currentTurn.activePlayerId = firstPlayerId;
        if (session.inGamePlayers[firstPlayerId]) {
            const player = session.inGamePlayers[firstPlayerId];
            const newSpeed = player.baseSpeed + player.speedBonus;
            player.speed = newSpeed;
        }

        this.initialization.assignStartPoints(session, game);
        this.sessionRepository.save(session);
        return session;
    }

    startSession(sessionId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        if (session.isGameStarted) throw new BadRequestException('Game already started');

        session.isGameStarted = true;
        session.currentTurn = this.timerService.startFirstTurn(session, DEFAULT_TURN_DURATION);

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

        this.sessionRepository.updatePlayer(sessionId, playerId, { isInGame: true });
        return this.sessionRepository.findById(sessionId);
    }

    endPlayerTurn(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        if (session.currentTurn.activePlayerId !== playerId) {
            throw new BadRequestException('Not your turn');
        }
        this.timerService.endTurnManual(session);
        return session;
    }

    attackPlayerAction(sessionId: string, playerId: string, x: number, y: number): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        this.actionService.attackPlayer(session, playerId, x, y);
        player.actionsRemaining--;
        session.currentTurn.hasUsedAction = true;
        if(!player.actionsRemaining && !player.speed) {
            this.timerService.endTurnManual(session);
        }
    }

    toggleDoorAction(sessionId: string, playerId: string, x: number, y: number): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        this.actionService.toggleDoor(session, playerId, x, y);
        player.actionsRemaining--;
        session.currentTurn.hasUsedAction = true;
        this.movementService.calculateReachableTiles(session, playerId);
        if(!player.actionsRemaining && !player.speed) {
            this.timerService.endTurnManual(session);
        }
    }

    movePlayer(sessionId: string, playerId: string, orientation: Orientation): void {
        const session = this.sessionRepository.findById(sessionId);
        if (playerId !== session.currentTurn.activePlayerId) throw new BadRequestException('Not your turn');
        if (this.timerService.getGameTimerState(sessionId) !== TurnTimerStates.PlayerTurn) throw new BadRequestException('Not your turn');
        const remainingSpeed = this.movementService.movePlayer(session, playerId, orientation);
        const availableActions =this.actionService.calculateAvailableActions(session, playerId);
        if(!remainingSpeed && !availableActions.length) {
            this.timerService.endTurnManual(session);
        }
    }

    leaveInGameSession(sessionId: string, playerId: string): { session: InGameSession; playerName: string; sessionEnded: boolean } {
        const player = this.sessionRepository.playerLeave(sessionId, playerId);
        const session = this.sessionRepository.findById(sessionId);
        const inGamePlayers = this.sessionRepository.inGamePlayersCount(sessionId);
        let sessionEnded = false;
        if (inGamePlayers < 2) {
            this.timerService.forceStopTimer(sessionId);
            sessionEnded = true;
        }

        return { session, playerName: player.name, sessionEnded };
    }

    getPlayers(sessionId: string): Player[] {
        return this.sessionRepository.getIngamePlayers(sessionId);
    }

    findSessionByPlayerId(playerId: string): InGameSession | null {
        return this.sessionRepository.findSessionByPlayerId(playerId);
    }

    getReachableTiles(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        this.movementService.calculateReachableTiles(session, playerId);
    }

    endCombat(sessionId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        this.eventEmitter.emit('combat.ended', { session });
    }

    combatChoice(sessionId: string, socketId: string, choice: 'offensive' | 'defensive'): void {
        const session = this.sessionRepository.findById(sessionId);
        this.eventEmitter.emit('combat.choice', { session, socketId, choice });
    }

    getAvailableActions(sessionId: string, playerId: string) {
        const session = this.sessionRepository.findById(sessionId);
        this.actionService.calculateAvailableActions(session, playerId);
    }

    @OnEvent('combat.started')
    handleCombatStarted(payload: { session: InGameSession; attackerId: string; targetId: string }): void {
        this.timerService.startCombatTimer(payload.session.id);
    }

    @OnEvent('combat.ended')
    handleCombatEnded(payload: { session: InGameSession }): void {
        this.timerService.stopCombatTimer(payload.session.id);
    }
}
