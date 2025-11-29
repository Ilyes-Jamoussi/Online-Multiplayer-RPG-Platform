import { ServerEvents } from '@app/enums/server-events.enum';
import { GameLogEntryDto } from '@app/modules/game-log/dto/game-log-entry.dto';
import {
    AdminModeToggledPayload,
    CombatStartedPayload,
    CombatVictoryPayload,
    DoorToggledPayload,
    GameOverPayload,
    PlayerAbandonPayload,
    PlayerBoardedBoatPayload,
    PlayerCombatResultPayload,
    PlayerDisembarkedBoatPayload,
    SanctuaryActionSuccessPayload,
    TeleportedPayload,
    TurnStartedPayload,
} from '@app/modules/game-log/dto/game-log-payloads.dto';
import { GameLogService } from '@app/modules/game-log/services/game-log.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { successResponse } from '@app/utils/socket-response/socket-response.util';
import { GameLogEvents } from '@common/enums/game-log-events.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { generateGameLogId } from '@common/utils/game-log.util';
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
        private readonly inGameService: InGameService,
    ) {}

    @OnEvent(ServerEvents.TurnStarted)
    handleTurnStarted(payload: TurnStartedPayload): void {
        const session = payload.session;
        const activePlayerId = session.currentTurn.activePlayerId;

        const entry = this.gameLogService.createTurnStartEntry(session.id, activePlayerId);
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.CombatStarted)
    handleCombatStarted(payload: CombatStartedPayload): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createCombatStartEntry(payload.sessionId, payload.attackerId, payload.targetId);
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.CombatVictory)
    handleCombatVictory(payload: CombatVictoryPayload): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createCombatEndEntry(payload.sessionId, payload.playerAId, payload.playerBId, payload.winnerId);
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.PlayerCombatResult)
    handlePlayerCombatResult(payload: PlayerCombatResultPayload): void {
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
    handleDoorToggled(payload: DoorToggledPayload): void {
        const entry = this.gameLogService.createDoorToggleEntry(payload.session.id, payload.playerId, payload.x, payload.y, payload.isOpen);
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    @OnEvent(ServerEvents.AdminModeToggled)
    handleAdminModeToggled(payload: AdminModeToggledPayload): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createDebugModeToggleEntry(payload.sessionId, payload.playerId, payload.isAdminModeActive);
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.PlayerAbandon)
    handlePlayerAbandon(payload: PlayerAbandonPayload): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createPlayerAbandonEntry(payload.sessionId, payload.playerId);
        this.emitLogEntry(session.inGameId, entry);
    }

    @OnEvent(ServerEvents.GameOver)
    handleGameOver(payload: GameOverPayload): void {
        const session = this.inGameSessionRepository.findById(payload.sessionId);
        if (!session) return;

        const entry = this.gameLogService.createGameOverEntry(payload.sessionId);
        this.emitLogEntry(session.inGameId, entry);
        this.inGameService.removeSession(payload.sessionId);
    }

    @OnEvent(ServerEvents.PlayerBoardedBoat)
    handlePlayerBoardedBoat(payload: PlayerBoardedBoatPayload): void {
        const entry = this.gameLogService.createBoatEmbarkEntry(payload.session.id, payload.playerId);
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    @OnEvent(ServerEvents.PlayerDisembarkedBoat)
    handlePlayerDisembarkedBoat(payload: PlayerDisembarkedBoatPayload): void {
        const entry = this.gameLogService.createBoatDisembarkEntry(payload.session.id, payload.playerId);
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    @OnEvent(ServerEvents.SanctuaryActionSuccess)
    handleSanctuaryActionSuccess(payload: SanctuaryActionSuccessPayload): void {
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
    handlePlayerTeleported(payload: TeleportedPayload): void {
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

    @OnEvent(ServerEvents.FlagPickedUp)
    handleFlagPickedUp(payload: { session: InGameSession; playerId: string }): void {
        const entry = this.gameLogService.createFlagPickupEntry(payload.session.id, payload.playerId);
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    @OnEvent(ServerEvents.FlagTransferred)
    handleFlagTransferred(payload: { session: InGameSession; fromPlayerId: string; toPlayerId: string }): void {
        const entry = this.gameLogService.createFlagTransferEntry(payload.session.id, payload.fromPlayerId, payload.toPlayerId);
        this.emitLogEntry(payload.session.inGameId, entry);
    }

    private emitLogEntry(inGameId: string, entry: Omit<GameLogEntryDto, 'id' | 'timestamp'>): void {
        const logEntry: GameLogEntryDto = {
            ...entry,
            id: generateGameLogId(),
            timestamp: new Date().toISOString(),
        };
        this.server.to(inGameId).emit(GameLogEvents.LogEntry, successResponse<GameLogEntryDto>(logEntry));
    }
}
