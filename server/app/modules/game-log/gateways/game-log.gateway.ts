import { ServerEvents } from '@app/enums/server-events.enum';
import { ID_GENERATION } from '@app/modules/game-log/constants/game-log.constants';
import { GameLogEntryDto } from '@app/modules/game-log/dto/game-log-entry.dto';
import { GameLogService } from '@app/modules/game-log/services/game-log.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { successResponse } from '@app/utils/socket-response/socket-response.util';
import { GameLogEvents } from '@common/enums/game-log-events.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
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

        const entryA = this.gameLogService.createCombatResultEntry({
            sessionId: payload.sessionId,
            attackerId: payload.playerAId,
            targetId: payload.playerBId,
            attackerAttack: payload.playerAAttack,
            targetDefense: payload.playerBDefense,
            damage: payload.playerBDamage,
        });
        this.emitLogEntry(session.inGameId, entryA);
    }

    @OnEvent(ServerEvents.DoorToggled)
    handleDoorToggled(payload: { session: InGameSession; playerId: string; x: number; y: number; isOpen: boolean }): void {
        const entry = this.gameLogService.createDoorToggleEntry(
            payload.session.id,
            payload.playerId,
            payload.x,
            payload.y,
            payload.isOpen,
        );
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    @OnEvent(ServerEvents.AdminModeToggled)
    handleAdminModeToggled(payload: { sessionId: string; playerId: string; isAdminModeActive: boolean }): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createDebugModeToggleEntry(
            payload.sessionId,
            payload.playerId,
            payload.isAdminModeActive,
        );
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.PlayerAbandon)
    handlePlayerAbandon(payload: { sessionId: string; playerId: string; playerName: string }): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createPlayerAbandonEntry(payload.sessionId, payload.playerId);
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.GameOver)
    handleGameOver(payload: { sessionId: string; winnerId: string; winnerName: string }): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createGameOverEntry(payload.sessionId);
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.PlayerBoardedBoat)
    handlePlayerBoardedBoat(payload: { session: InGameSession; playerId: string; boatId: string }): void {
        const entry = this.gameLogService.createBoatEmbarkEntry(payload.session.id, payload.playerId);
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    @OnEvent(ServerEvents.PlayerDisembarkedBoat)
    handlePlayerDisembarkedBoat(payload: { session: InGameSession; playerId: string }): void {
        const entry = this.gameLogService.createBoatDisembarkEntry(payload.session.id, payload.playerId);
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    @OnEvent(ServerEvents.SanctuaryActionSuccess)
    handleSanctuaryActionSuccess(payload: {
        session: InGameSession;
        playerId: string;
        kind: PlaceableKind;
        x: number;
        y: number;
        addedHealth?: number;
        addedDefense?: number;
        addedAttack?: number;
    }): void {
        const entry = this.gameLogService.createSanctuaryUseEntry({
            sessionId: payload.session.id,
            playerId: payload.playerId,
            kind: payload.kind,
            x: payload.x,
            y: payload.y,
            addedHealth: payload.addedHealth,
            addedDefense: payload.addedDefense,
            addedAttack: payload.addedAttack,
        });
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    @OnEvent(ServerEvents.Teleported)
    handlePlayerTeleported(payload: {
        session: InGameSession;
        playerId: string;
        originX: number;
        originY: number;
        destinationX: number;
        destinationY: number;
    }): void {
        const entry = this.gameLogService.createTeleportEntry({
            sessionId: payload.session.id,
            playerId: payload.playerId,
            originX: payload.originX,
            originY: payload.originY,
            destinationX: payload.destinationX,
            destinationY: payload.destinationY,
        });
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    private emitLogEntry(inGameId: string, entry: Omit<GameLogEntryDto, 'id' | 'timestamp'>): void {
        const logEntry: GameLogEntryDto = {
            ...entry,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
        };
        this.server.to(inGameId).emit(GameLogEvents.LogEntry, successResponse<GameLogEntryDto>(logEntry));
    }


    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(ID_GENERATION.radix).substring(2, 2 + ID_GENERATION.substringLength)}`;
    }
}

