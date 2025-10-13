import { Game, GameDocument } from '@app/modules/game-store/entities/game.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { InGamePlayer } from '@common/models/player.interface';
import { InGameSession, Session } from '@common/models/session.interface';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

const SHUFFLE_FACTOR = 0.5;
const MILLISECONDS_PER_SECOND = 1000;
const DEFAULT_TURN_DURATION = 30;

interface InGameGrid {
    id: string;
    size: MapSize;
    tiles: Tile[];
    objects: Placeable[];
}

@Injectable()
export class TurnTimerService {
    private readonly timers = new Map<string, NodeJS.Timeout>();

    startTurnTimer(sessionId: string, duration: number, onTimeout: () => void): void {
        this.clearTurnTimer(sessionId);

        const timer = setTimeout(() => {
            onTimeout();
            this.timers.delete(sessionId);
        }, duration * MILLISECONDS_PER_SECOND);

        this.timers.set(sessionId, timer);
    }

    clearTurnTimer(sessionId: string): void {
        const timer = this.timers.get(sessionId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(sessionId);
        }
    }

    getRemainingTime(sessionId: string): number {
        return this.timers.has(sessionId) ? 1 : 0;
    }
}

@Injectable()
export class InGameService {
    private readonly inGameSessions = new Map<string, InGameSession>();
    private readonly inGameGrids = new Map<string, InGameGrid>();

    constructor(
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
        private readonly turnTimerService: TurnTimerService,
    ) {}

    getInGameSession(sessionId: string): InGameSession | undefined {
        return this.inGameSessions.get(sessionId);
    }

    async initInGameSession(session: Session): Promise<string> {
        const game = await this.gameModel.findById(session.gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        const gameStartPoints = this.getGameStartPoints(game);

        const inGamePlayers: InGamePlayer[] = session.players.map((player) => ({
            id: player.id,
            name: player.name,
            avatar: player.avatar,
            isAdmin: player.isAdmin,
            currentPosition: { x: 0, y: 0 },
            isActive: false,
            joinedInGameSession: false,
            startPointId: '',
        }));

        const gameGrid: InGameGrid = {
            id: game._id.toString(),
            size: game.size,
            tiles: game.tiles,
            objects: game.objects,
        };

        const inGameGrid = this.buildGameGrid(gameGrid, gameStartPoints);
        this.inGameGrids.set(session.id, inGameGrid);

        const { startPoints: assignStartPoints, players: assignedPlayers } = this.assignStartPoints(gameStartPoints, inGamePlayers);

        const turnOrderIndex = this.getRandomTurnOrderIndex(assignedPlayers);
        const activePlayerId = assignedPlayers[turnOrderIndex[0]].id;

        const inGameSession: InGameSession = {
            id: this.buildGameSessionId(session.id, game._id.toString()),
            sessionId: session.id,
            gameId: session.gameId,
            mapSize: game.size,
            mode: game.mode,
            players: assignedPlayers,
            startPoints: assignStartPoints,
            turnOrderIndex,
            currentTurnIndex: 0,
            currentTurn: 0,
            activePlayerId,
        };

        this.inGameSessions.set(session.id, inGameSession);
        return inGameSession.id;
    }

    joinInGameSession(socketId: string, sessionId: string): InGameSession {
        const inGameSession = this.inGameSessions.get(sessionId);
        if (!inGameSession) {
            throw new Error('In game session not found');
        }
        const player = this.getPlayerBySocketId(socketId, sessionId);
        if (!player) {
            throw new Error('Player not found');
        }
        player.joinedInGameSession = true;
        this.inGameSessions.set(sessionId, {
            ...inGameSession,
            players: inGameSession.players.map((p) => (p.id === player.id ? { ...p, joinedInGameSession: true } : p)),
        });
        return this.inGameSessions.get(sessionId);
    }

    private getGameStartPoints(game: Game): { x: number; y: number; id: string; playerId: string }[] {
        return game.objects
            .filter((object) => object.kind === PlaceableKind.START)
            .map((startPoint) => ({
                x: startPoint.x,
                y: startPoint.y,
                id: startPoint._id.toString(),
                playerId: '',
            }));
    }

    private getPlayerBySocketId(socketId: string, sessionId: string): InGamePlayer | undefined {
        return this.inGameSessions.get(sessionId)?.players.find((player) => player.id === socketId);
    }

    private assignStartPoints(
        startPoints: { x: number; y: number; id: string; playerId: string }[],
        players: InGamePlayer[],
    ): { startPoints: { x: number; y: number; id: string; playerId: string }[]; players: InGamePlayer[] } {
        const availableStartPoints = [...startPoints];
        const assignedPoints: { x: number; y: number; id: string; playerId: string }[] = [];
        const assignedPlayers: InGamePlayer[] = [];
        for (const player of players) {
            if (availableStartPoints.length === 0) {
                break;
            }

            const randomIndex = Math.floor(Math.random() * availableStartPoints.length);
            const selectedStartPoint = availableStartPoints.splice(randomIndex, 1)[0];

            assignedPoints.push({
                x: selectedStartPoint.x,
                y: selectedStartPoint.y,
                id: selectedStartPoint.id,
                playerId: player.id,
            });
            assignedPlayers.push({ ...player, startPointId: selectedStartPoint.id });
        }

        return { startPoints: assignedPoints, players: assignedPlayers };
    }

    private getRandomTurnOrderIndex(players: InGamePlayer[]): number[] {
        const length = players.length;
        const turnOrderIndex: number[] = [];
        for (let i = 0; i < length; i++) {
            turnOrderIndex.push(i);
        }
        turnOrderIndex.sort(() => Math.random() - SHUFFLE_FACTOR);
        return turnOrderIndex;
    }

    private buildGameSessionId(sessionId: string, gameId: string): string {
        return `${sessionId}-${gameId}`;
    }

    private buildGameGrid(gameGrid: InGameGrid, startPoints: { x: number; y: number; id: string; playerId: string }[]): InGameGrid {
        const filteredObjects = gameGrid.objects.filter((o) => {
            const isStartPoint = o.kind === PlaceableKind.START;
            if (!isStartPoint) {
                return true;
            }

            return startPoints.some((startPoint) => startPoint.playerId === '' && startPoint.id === o._id.toString());
        });
        return {
            ...gameGrid,
            objects: filteredObjects,
        };
    }

    startTurn(
        sessionId: string,
        playerId: string,
        callback: (updatedSession: InGameSession) => void,
        duration: number = DEFAULT_TURN_DURATION,
    ): void {
        const inGameSession = this.inGameSessions.get(sessionId);
        if (!inGameSession) {
            throw new Error('In game session not found');
        }
        const activePlayer = this.getCurrentPlayer(sessionId);
        if (activePlayer?.id !== playerId) {
            throw new Error('Player is not active');
        }
        this.turnTimerService.startTurnTimer(sessionId, duration, () => {
            this.endTurn(sessionId, callback);
        });
    }

    endTurn(sessionId: string, callback: (updatedSession: InGameSession) => void): void {
        const inGameSession = this.inGameSessions.get(sessionId);
        if (!inGameSession) {
            return;
        }
        const nextTurnIndex = (inGameSession.currentTurnIndex + 1) % inGameSession.turnOrderIndex.length;
        const nextPlayerId = inGameSession.players[inGameSession.turnOrderIndex[nextTurnIndex]].id;

        const updatedSession = {
            ...inGameSession,
            currentTurnIndex: nextTurnIndex,
            currentTurn: inGameSession.currentTurn + 1,
            players: inGameSession.players.map((player) =>
                player.id === nextPlayerId ? { ...player, isActive: true } : { ...player, isActive: false },
            ),
            activePlayerId: nextPlayerId,
        };

        this.inGameSessions.set(sessionId, updatedSession);

        if (callback) {
            callback(updatedSession);
        }
    }

    getCurrentPlayer(sessionId: string): InGamePlayer | undefined {
        const inGameSession = this.inGameSessions.get(sessionId);
        if (!inGameSession) {
            return undefined;
        }

        const currentPlayerIndex = inGameSession.turnOrderIndex[inGameSession.currentTurnIndex];
        return inGameSession.players[currentPlayerIndex];
    }
}
