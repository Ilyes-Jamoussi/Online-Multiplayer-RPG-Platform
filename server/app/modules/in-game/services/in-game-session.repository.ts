import { Injectable, NotFoundException } from '@nestjs/common';
import { InGameSession } from '@common/models/session.interface';
import { InGamePlayer } from '@common/models/player.interface';

@Injectable()
export class InGameSessionRepository {
    private readonly sessions = new Map<string, InGameSession>();

    inGamePlayersCount(sessionId: string): number {
        return this.getIngamePlayers(sessionId).length;
    }

    getIngamePlayers(sessionId: string): InGamePlayer[] {
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

    playerLeave(sessionId: string, playerId: string): InGamePlayer {
        const session = this.findById(sessionId);
        session.inGamePlayers[playerId].isInGame = false;
        session.inGamePlayers[playerId].x = -1;
        session.inGamePlayers[playerId].y = -1;
        this.removeStartPoint(sessionId, session.inGamePlayers[playerId].startPointId);
        this.removePlayerFromTurnOrder(sessionId, playerId);
        return session.inGamePlayers[playerId];
    }

    removeStartPoint(sessionId: string, startPointId: string): void {
        const session = this.findById(sessionId);
        session.startPoints = session.startPoints.filter((s) => s.id !== startPointId);
    }

    removePlayerFromTurnOrder(sessionId: string, playerId: string): void {
        const session = this.findById(sessionId);
        session.turnOrder = session.turnOrder.filter((id) => id !== playerId);
    }
}
