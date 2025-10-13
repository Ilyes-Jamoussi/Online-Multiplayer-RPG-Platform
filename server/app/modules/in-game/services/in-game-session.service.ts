// src/in-game/services/in-game-session.service.ts
import { Injectable } from '@nestjs/common';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { InGamePlayer } from '@common/models/player.interface';
import { InGameSession, Session } from '@common/models/session.interface';

type StartPoint = { x: number; y: number; id: string; playerId: string };

export interface CreateInGameSessionInput {
    baseSession: Session;
    mapSize: MapSize;
    mode: GameMode;
    startPoints: StartPoint[];
    turnOrderIndex: number[];
    activePlayerId: string;
}

@Injectable()
export class InGameSessionService {
    private readonly sessions = new Map<string, InGameSession>();

    /** CRUD de base */
    create(input: CreateInGameSessionInput): InGameSession {
        const players: InGamePlayer[] = input.baseSession.players.map((p) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            isAdmin: p.isAdmin,
            currentPosition: { x: 0, y: 0 },
            isActive: p.id === input.activePlayerId,
            joinedInGameSession: false,
            startPointId: '',
        }));

        const session: InGameSession = {
            id: this.buildGameSessionId(input.baseSession.id, input.baseSession.gameId),
            sessionId: input.baseSession.id,
            gameId: input.baseSession.gameId,
            mapSize: input.mapSize,
            mode: input.mode,
            players,
            startPoints: input.startPoints,
            turnOrderIndex: input.turnOrderIndex,
            currentTurnIndex: 0,
            currentTurn: 0,
            activePlayerId: input.activePlayerId,
        };

        this.sessions.set(input.baseSession.id, session);
        return session;
    }

    get(sessionId: string): InGameSession | undefined {
        return this.sessions.get(sessionId);
    }

    upsert(session: InGameSession): void {
        this.sessions.set(session.sessionId, session);
    }

    /** Gestion joueurs */
    join(sessionId: string, playerId: string): InGameSession {
        const s = this.mustGet(sessionId);
        const updated = {
            ...s,
            players: s.players.map((p) => (p.id === playerId ? { ...p, joinedInGameSession: true } : p)),
        };
        this.upsert(updated);
        return updated;
    }

    leave(sessionId: string, playerId: string): InGameSession {
        const s = this.mustGet(sessionId);

        const startPoints = s.startPoints.filter((sp) => sp.playerId !== playerId);
        const turnOrderIndex = s.turnOrderIndex.filter((idx) => s.players[idx].id !== playerId);

        let activePlayerId = s.activePlayerId;
        if (s.activePlayerId === playerId && turnOrderIndex.length > 0) {
            const nextTurnIndex = (s.currentTurnIndex + 1) % turnOrderIndex.length;
            activePlayerId = s.players[turnOrderIndex[nextTurnIndex]].id;
        }

        const updated: InGameSession = {
            ...s,
            startPoints,
            turnOrderIndex,
            activePlayerId,
            players: s.players
                .filter((p) => p.id !== playerId)
                .map((p) => ({
                    ...p,
                    isActive: p.id === activePlayerId,
                })),
        };

        this.upsert(updated);
        return updated;
    }

    /** Utilitaires de tour (sans timer, pur état) */
    getCurrentPlayer(sessionId: string) {
        const s = this.mustGet(sessionId);
        const idx = s.turnOrderIndex[s.currentTurnIndex];
        return s.players[idx];
    }

    advanceToNextPlayer(sessionId: string): InGameSession {
        const s = this.mustGet(sessionId);
        if (s.turnOrderIndex.length === 0) return s;

        const nextTurnIndex = (s.currentTurnIndex + 1) % s.turnOrderIndex.length;
        const nextPlayerId = s.players[s.turnOrderIndex[nextTurnIndex]].id;

        const updated: InGameSession = {
            ...s,
            currentTurnIndex: nextTurnIndex,
            currentTurn: s.currentTurn + 1,
            activePlayerId: nextPlayerId,
            players: s.players.map((p) => ({ ...p, isActive: p.id === nextPlayerId })),
        };

        this.upsert(updated);
        return updated;
    }

    /** Assignation du startPoint à un joueur (mutation pure de session) */
    setPlayerStartPoint(sessionId: string, playerId: string, startPointId: string): InGameSession {
        const s = this.mustGet(sessionId);

        const startPoints = s.startPoints.map((sp) =>
            sp.id === startPointId ? { ...sp, playerId } : sp.playerId === playerId ? { ...sp, playerId: '' } : sp,
        );

        const players = s.players.map((p) => (p.id === playerId ? { ...p, startPointId } : p));

        const updated = { ...s, startPoints, players };
        this.upsert(updated);
        return updated;
    }

    /** Helpers */
    private mustGet(sessionId: string): InGameSession {
        const s = this.sessions.get(sessionId);
        if (!s) throw new Error('In game session not found');
        return s;
    }

    private buildGameSessionId(sessionId: string, gameId: string): string {
        return `${sessionId}-${gameId}`;
    }
}
