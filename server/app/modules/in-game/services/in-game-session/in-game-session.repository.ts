import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InGameSession } from '@common/models/session.interface';
import { Player } from '@common/models/player.interface';
import { StartPoint } from '@common/models/start-point.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';

@Injectable()
export class InGameSessionRepository {
    private readonly sessions = new Map<string, InGameSession>();

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly gameCache: GameCacheService,
    ) {}

    updatePlayer(sessionId: string, playerId: string, updates: Partial<Player>): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');

        Object.assign(player, updates);
        this.update(session);

        this.eventEmitter.emit('player.updated', {
            sessionId,
            player,
        });
    }

    decreasePlayerHealth(sessionId: string, playerId: string, health: number): number {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        const newHealth = player.health - health;
        player.health = newHealth > 0 ? newHealth : 0;

        return player.health;
    }

    resetPlayerHealth(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.health = player.maxHealth;

        this.eventEmitter.emit('player.healthChanged', {
            sessionId,
            playerId,
            newHealth: player.health,
        });
    }

    incrementPlayerCombatCount(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.combatCount++;
        this.eventEmitter.emit('player.combatCountChanged', {
            sessionId,
            playerId,
            combatCount: player.combatCount,
        });
    }

    incrementPlayerCombatWins(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.combatWins++;
        this.eventEmitter.emit('player.combatWinsChanged', {
            sessionId,
            playerId,
            combatWins: player.combatWins,
        });
    }

    incrementPlayerCombatLosses(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.combatLosses++;
        this.eventEmitter.emit('player.combatLossesChanged', {
            sessionId,
            playerId,
            combatLosses: player.combatLosses,
        });
    }

    incrementPlayerCombatDraws(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.combatDraws++;
        this.eventEmitter.emit('player.combatDrawsChanged', {
            sessionId,
            playerId,
            combatDraws: player.combatDraws,
        });
    }

    inGamePlayersCount(sessionId: string): number {
        return this.getIngamePlayers(sessionId).length;
    }

    getIngamePlayers(sessionId: string): Player[] {
        const session = this.findById(sessionId);
        return Object.values(session.inGamePlayers).filter((p) => p.isInGame);
    }

    save(session: InGameSession): void {
        this.sessions.set(session.id, session);
    }

    findById(sessionId: string): InGameSession {
        const session = this.sessions.get(sessionId);
        if (!session) throw new NotFoundException('Session not found');
        return session;
    }

    update(session: InGameSession): void {
        this.sessions.set(session.id, session);
    }

    delete(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    deleteAll(): void {
        this.sessions.clear();
    }

    playerLeave(sessionId: string, playerId: string): Player {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');

        session.inGamePlayers[playerId].isInGame = false;

        if (player.x >= 0 && player.y >= 0) {
            this.gameCache.clearTileOccupant(sessionId, player.x, player.y);
        }

        player.x = -1;
        player.y = -1;
        this.removeStartPoint(sessionId, player.startPointId);
        return player;
    }

    removeStartPoint(sessionId: string, startPointId: string): void {
        const session = this.findById(sessionId);
        session.startPoints = session.startPoints.filter((s) => s.id !== startPointId);
    }

    removePlayerFromTurnOrder(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        session.turnOrder = session.turnOrder.filter((id) => id !== playerId);
    }

    findSessionByPlayerId(playerId: string): InGameSession | null {
        for (const session of this.sessions.values()) {
            if (session.inGamePlayers[playerId]?.isInGame) {
                return session;
            }
        }
        return null;
    }

    findStartPointById(sessionId: string, startPointId: string): StartPoint | null {
        const session = this.findById(sessionId);
        return session.startPoints.find((s) => s.id === startPointId);
    }

    movePlayerPosition(
        sessionId: string,
        playerId: string,
        newX: number,
        newY: number,
        cost: number,
    ): { oldX: number; oldY: number; newX: number; newY: number } {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');

        const oldX = player.x;
        const oldY = player.y;

        this.gameCache.moveTileOccupant(sessionId, newX, newY, player);

        player.x = newX;
        player.y = newY;
        player.speed = player.speed - cost;

        this.eventEmitter.emit('player.moved', {
            session,
            playerId,
            x: newX,
            y: newY,
            speed: player.speed,
        });

        return { oldX, oldY, newX, newY };
    }
}
