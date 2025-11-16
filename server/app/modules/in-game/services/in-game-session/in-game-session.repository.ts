import { ServerEvents } from '@app/enums/server-events.enum';
import { MoveResult } from '@app/interfaces/move-result.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { BOAT_SPEED_BONUS } from '@common/constants/game.constants';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { StartPoint } from '@common/interfaces/start-point.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

        this.eventEmitter.emit(ServerEvents.PlayerUpdated, {
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

    increasePlayerHealth(sessionId: string, playerId: string, health: number): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.health += health;
        if (player.health > player.maxHealth) player.health = player.maxHealth;
        this.eventEmitter.emit(ServerEvents.PlayerHealthChanged, {
            sessionId,
            playerId,
            newHealth: player.health,
        });
    }

    resetPlayerHealth(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.health = player.maxHealth;

        this.eventEmitter.emit(ServerEvents.PlayerHealthChanged, {
            sessionId,
            playerId,
            newHealth: player.health,
        });
    }

    applyPlayerBonus(sessionId: string, playerId: string, value: 1 | 2): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.attackBonus += value;
        player.defenseBonus += value;

        this.eventEmitter.emit(ServerEvents.PlayerBonusesChanged, {
            sessionId,
            playerId,
            attackBonus: player.attackBonus,
            defenseBonus: player.defenseBonus,
        });
    }

    applyPlayerBoatSpeedBonus(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        this.updatePlayer(sessionId, playerId, { boatSpeedBonus: BOAT_SPEED_BONUS, boatSpeed: BOAT_SPEED_BONUS });
    }

    resetPlayerBoatSpeedBonus(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        this.updatePlayer(sessionId, playerId, { boatSpeedBonus: 0, boatSpeed: 0 });
    }

    resetPlayerBonuses(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.attackBonus = 0;
        player.defenseBonus = 0;
        player.hasCombatBonus = false;

        this.eventEmitter.emit(ServerEvents.PlayerBonusesChanged, {
            sessionId,
            playerId,
            attackBonus: player.attackBonus,
            defenseBonus: player.defenseBonus,
        });
    }

    incrementPlayerCombatCount(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        player.combatCount++;
        this.eventEmitter.emit(ServerEvents.PlayerCombatCountChanged, {
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
        this.eventEmitter.emit(ServerEvents.PlayerCombatWinsChanged, {
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
        this.eventEmitter.emit(ServerEvents.PlayerCombatLossesChanged, {
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
        this.eventEmitter.emit(ServerEvents.PlayerCombatDrawsChanged, {
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

    playerLeave(sessionId: string, playerId: string): Player {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');

        session.inGamePlayers[playerId].isInGame = false;

        if (player.x >= 0 && player.y >= 0) {
            this.gameCache.clearTileOccupant(sessionId, player.x, player.y);
        }

        this.gameCache.reenablePlaceablesForPlayer(sessionId, playerId);

        player.x = -1;
        player.y = -1;
        this.removeStartPoint(sessionId, player.startPointId);
        return player;
    }

    private removeStartPoint(sessionId: string, startPointId: string): void {
        const session = this.findById(sessionId);
        session.startPoints = session.startPoints.filter((s) => s.id !== startPointId);
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

    movePlayerPosition(sessionId: string, playerId: string, newX: number, newY: number, cost: number): MoveResult {
        const session = this.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');

        const oldX = player.x;
        const oldY = player.y;

        this.gameCache.moveTileOccupant(sessionId, newX, newY, player);

        player.x = newX;
        player.y = newY;

        if (player.onBoatId && player.boatSpeed) {
            player.boatSpeed = player.boatSpeed - cost;
        } else {
            player.speed = player.speed - cost;
        }

        this.eventEmitter.emit(ServerEvents.PlayerMoved, {
            session,
            playerId,
            x: newX,
            y: newY,
            speed: player.speed,
            boatSpeed: player.boatSpeed,
        });

        return { oldX, oldY, newX, newY };
    }
}
