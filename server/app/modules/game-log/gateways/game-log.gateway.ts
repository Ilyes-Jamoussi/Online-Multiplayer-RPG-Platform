import { ServerEvents } from '@app/enums/server-events.enum';
import { GameLogEntryDto } from '@app/modules/game-log/dto/game-log-entry.dto';
import { GameLogService } from '@app/modules/game-log/services/game-log.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { successResponse } from '@app/utils/socket-response/socket-response.util';
import { GameLogEvents } from '@common/enums/game-log-events.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: true,
})
@Injectable()
export class GameLogGateway {
    @WebSocketServer() private readonly server: Server;

    constructor(
        private readonly gameLogService: GameLogService,
        private readonly inGameSessionRepository: InGameSessionRepository,
    ) {}

    @OnEvent(ServerEvents.TurnStarted)
    handleTurnStarted(payload: { session: InGameSession }): void {
        const session = payload.session;
        const activePlayerId = session.currentTurn.activePlayerId;

        const entry = this.gameLogService.createTurnStartEntry(session.id, activePlayerId);
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.CombatStarted)
    handleCombatStarted(payload: { sessionId: string; attackerId: string; targetId: string }): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createCombatStartEntry(payload.sessionId, payload.attackerId, payload.targetId);
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.CombatVictory)
    handleCombatVictory(payload: { sessionId: string; playerAId: string; playerBId: string; winnerId: string | null }): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createCombatEndEntry(
            payload.sessionId,
            payload.playerAId,
            payload.playerBId,
            payload.winnerId,
        );
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.PlayerCombatResult)
    handlePlayerCombatResult(payload: {
        sessionId: string;
        playerAId: string;
        playerBId: string;
        playerAAttack: { diceRoll: number; baseAttack: number; attackBonus: number; totalAttack: number };
        playerBAttack: { diceRoll: number; baseAttack: number; attackBonus: number; totalAttack: number };
        playerADefense: { diceRoll: number; baseDefense: number; defenseBonus: number; totalDefense: number };
        playerBDefense: { diceRoll: number; baseDefense: number; defenseBonus: number; totalDefense: number };
        playerADamage: number;
        playerBDamage: number;
    }): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entryA = this.gameLogService.createCombatResultEntry(
            payload.sessionId,
            payload.playerAId,
            payload.playerBId,
            payload.playerAAttack,
            payload.playerBDefense,
            payload.playerBDamage,
        );
        this.emitLogEntryToPlayers(session.inGameId, entryA, [payload.playerAId, payload.playerBId]);
    }

    private emitLogEntry(inGameId: string, entry: Omit<GameLogEntryDto, 'id' | 'timestamp'>): void {
        const logEntry: GameLogEntryDto = {
            ...entry,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
        };
        this.server.to(inGameId).emit(GameLogEvents.LogEntry, successResponse<GameLogEntryDto>(logEntry));
    }

    private emitLogEntryToPlayers(
        inGameId: string,
        entry: Omit<GameLogEntryDto, 'id' | 'timestamp'>,
        playerIds: string[],
    ): void {
        const logEntry: GameLogEntryDto = {
            ...entry,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
        };
        this.server.to(inGameId).emit(GameLogEvents.LogEntry, successResponse<GameLogEntryDto>(logEntry));
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

