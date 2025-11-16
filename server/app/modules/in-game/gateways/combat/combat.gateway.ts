import { ServerEvents } from '@app/enums/server-events.enum';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { InGameEvents } from '@common/enums/in-game-events.enum';
<<<<<<< HEAD
import { NotificationEvents } from '@common/enums/notification-events.enum';
import { ServerEvents } from '@app/enums/server-events.enum';
=======
>>>>>>> origin/dev
import { CombatResult } from '@common/interfaces/combat.interface';
import { Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UsePipes(
    new ValidationPipe({
        transform: true,
        exceptionFactory: validationExceptionFactory,
    }),
)
@WebSocketGateway({})
@Injectable()
export class CombatGateway {
    @WebSocketServer() private readonly server: Server;

    constructor(private readonly combatService: CombatService) {}

    @SubscribeMessage(InGameEvents.AttackPlayerAction)
    attackPlayerAction(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.combatService.attackPlayerAction(payload.sessionId, socket.id, { x: payload.x, y: payload.y });
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.CombatChoice)
    combatChoice(socket: Socket, payload: { sessionId: string; choice: CombatPosture }): void {
        try {
            this.combatService.combatChoice(payload.sessionId, socket.id, payload.choice);
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.CombatAbandon)
    combatAbandon(socket: Socket, payload: { sessionId: string }): void {
        try {
            this.combatService.combatAbandon(payload.sessionId, socket.id);
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @OnEvent(ServerEvents.CombatStarted)
    handleCombatStarted(payload: {
        sessionId: string;
        attackerId: string;
        targetId: string;
        attackerTileEffect?: number;
        targetTileEffect?: number;
    }) {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            this.server.to(session.inGameId).emit(
                InGameEvents.CombatStarted,
                successResponse({
                    attackerId: payload.attackerId,
                    targetId: payload.targetId,
                    attackerTileEffect: payload.attackerTileEffect,
                    targetTileEffect: payload.targetTileEffect,
                }),
            );
        }
    }

    @OnEvent(ServerEvents.CombatTimerRestart)
    handleCombatTimerRestart(payload: { sessionId: string }): void {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            this.server.to(session.inGameId).emit(InGameEvents.CombatTimerRestart, successResponse({}));
        }
    }

    @OnEvent(ServerEvents.CombatVictory)
    handleCombatVictory(payload: { sessionId: string; playerAId: string; playerBId: string; winnerId: string | null; abandon: boolean }) {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            this.server.to(session.inGameId).emit(
                InGameEvents.CombatVictory,
                successResponse({
                    playerAId: payload.playerAId,
                    playerBId: payload.playerBId,
                    winnerId: payload.winnerId,
                    abandon: payload.abandon,
                }),
            );
        }
    }

    @OnEvent(ServerEvents.CombatNewRound)
    handleCombatNewRound(payload: { sessionId: string }) {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            this.server.to(session.inGameId).emit(InGameEvents.CombatNewRoundStarted, successResponse({}));
        }
    }

    @OnEvent(ServerEvents.CombatPostureSelected)
    handleCombatPostureSelected(payload: { sessionId: string; playerId: string; posture: CombatPosture }) {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            this.server.to(session.inGameId).emit(
                InGameEvents.CombatPostureSelected,
                successResponse({
                    playerId: payload.playerId,
                    posture: payload.posture,
                }),
            );
        }
    }

    @OnEvent(ServerEvents.PlayerCombatResult)
    handlePlayerCombatResult(payload: { sessionId: string } & CombatResult) {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            const combatResult: CombatResult = {
                playerAId: payload.playerAId,
                playerBId: payload.playerBId,
                playerAAttack: payload.playerAAttack,
                playerBAttack: payload.playerBAttack,
                playerADefense: payload.playerADefense,
                playerBDefense: payload.playerBDefense,
                playerADamage: payload.playerADamage,
                playerBDamage: payload.playerBDamage,
            };
            this.server.to(session.inGameId).emit(InGameEvents.PlayerCombatResult, successResponse(combatResult));
        }
    }

    @OnEvent(ServerEvents.PlayerHealthChanged)
    handlePlayerHealthChanged(payload: { sessionId: string; playerId: string; newHealth: number }) {
        const session = this.combatService.getSession(payload.sessionId);
        this.server
            .to(session.inGameId)
            .emit(InGameEvents.PlayerHealthChanged, successResponse({ playerId: payload.playerId, newHealth: payload.newHealth }));
    }

    @OnEvent(ServerEvents.PlayerCombatCountChanged)
    handlePlayerCombatCountChanged(payload: { sessionId: string; playerId: string; combatCount: number }) {
        const session = this.combatService.getSession(payload.sessionId);
        this.server
            .to(session.inGameId)
            .emit(InGameEvents.CombatCountChanged, successResponse({ playerId: payload.playerId, combatCount: payload.combatCount }));
    }

    @OnEvent(ServerEvents.PlayerCombatWinsChanged)
    handlePlayerCombatWinsChanged(payload: { sessionId: string; playerId: string; combatWins: number }) {
        const session = this.combatService.getSession(payload.sessionId);
        this.server
            .to(session.inGameId)
            .emit(InGameEvents.CombatWinsChanged, successResponse({ playerId: payload.playerId, combatWins: payload.combatWins }));
    }

    @OnEvent(ServerEvents.PlayerCombatLossesChanged)
    handlePlayerCombatLossesChanged(payload: { sessionId: string; playerId: string; combatLosses: number }) {
        const session = this.combatService.getSession(payload.sessionId);
        this.server
            .to(session.inGameId)
            .emit(InGameEvents.CombatLossesChanged, successResponse({ playerId: payload.playerId, combatLosses: payload.combatLosses }));
    }

    @OnEvent(ServerEvents.PlayerCombatDrawsChanged)
    handlePlayerCombatDrawsChanged(payload: { sessionId: string; playerId: string; combatDraws: number }) {
        const session = this.combatService.getSession(payload.sessionId);
        this.server
            .to(session.inGameId)
            .emit(InGameEvents.CombatDrawsChanged, successResponse({ playerId: payload.playerId, combatDraws: payload.combatDraws }));
    }
}
