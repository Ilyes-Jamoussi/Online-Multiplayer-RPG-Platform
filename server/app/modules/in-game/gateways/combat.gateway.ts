import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { InGameEvents } from '@common/constants/in-game-events';
import { CombatResult } from '@common/interfaces/combat.interface';
import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UsePipes(
    new ValidationPipe({
        transform: true,
        exceptionFactory: (errors): Error => {
            new Logger('ValidationPipe').error('Validation failed:', errors);
            throw new Error('Validation failed');
        },
    }),
)
@WebSocketGateway({})
@Injectable()
export class CombatGateway {
    @WebSocketServer() private readonly server: Server;
    private readonly logger = new Logger(CombatGateway.name);

    constructor(private readonly combatService: CombatService) {}

    @SubscribeMessage(InGameEvents.AttackPlayerAction)
    attackPlayerAction(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.combatService.attackPlayerAction(payload.sessionId, socket.id, payload.x, payload.y);
        } catch (error) {
            socket.emit(InGameEvents.AttackPlayerAction, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.CombatChoice)
    combatChoice(socket: Socket, payload: { sessionId: string; choice: 'offensive' | 'defensive' }): void {
        try {
            this.combatService.combatChoice(payload.sessionId, socket.id, payload.choice);
        } catch (error) {
            socket.emit(InGameEvents.CombatChoice, errorResponse(error.message));
        }
    }

    @OnEvent('combat.started')
    handleCombatStarted(payload: { sessionId: string; attackerId: string; targetId: string }) {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            this.server.to(session.inGameId).emit(
                InGameEvents.CombatStarted,
                successResponse({
                    attackerId: payload.attackerId,
                    targetId: payload.targetId,
                }),
            );
        }
    }

    @OnEvent('combat.timerRestart')
    handleCombatTimerRestart(payload: { sessionId: string }): void {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            this.logger.log(`Combat timer restarted for session ${session.id}`);
            this.server.to(session.inGameId).emit(InGameEvents.CombatTimerRestart, successResponse({}));
        }
    }

    @OnEvent('combat.ended')
    handleCombatEnded(payload: { sessionId: string }) {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            this.server.to(session.inGameId).emit(InGameEvents.CombatEnded, successResponse({}));
        }
    }

    @OnEvent('combat.newRound')
    handleCombatNewRound(payload: { sessionId: string }) {
        const session = this.combatService.getSession(payload.sessionId);
        if (session) {
            this.server.to(session.inGameId).emit(InGameEvents.CombatNewRoundStarted, successResponse({}));
        }
    }

    @OnEvent('player.combatResult')
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

    @OnEvent('player.healthChanged')
    handlePlayerHealthChanged(payload: { sessionId: string; playerId: string; newHealth: number }) {
        const session = this.combatService.getSession(payload.sessionId);
        this.server
            .to(session.inGameId)
            .emit(InGameEvents.PlayerHealthChanged, successResponse({ playerId: payload.playerId, newHealth: payload.newHealth }));
    }
}
