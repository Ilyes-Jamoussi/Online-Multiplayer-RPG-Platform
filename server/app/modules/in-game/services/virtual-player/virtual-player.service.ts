import {
    VIRTUAL_PLAYER_ACTION_DELAY_MS,
    VIRTUAL_PLAYER_THINKING_DELAY_MAX_MS,
    VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS,
} from '@app/constants/virtual-player.constants';
import { ServerEvents } from '@app/enums/server-events.enum';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { VPExecutionService } from '@app/modules/in-game/services/vp-execution/vp-execution.service';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class VirtualPlayerService {
    constructor(
        private readonly gameplayService: GameplayService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly vpExecutionService: VPExecutionService,
    ) {}

    @OnEvent(ServerEvents.VirtualPlayerCombatStarted)
    handleCombatStarted(payload: { sessionId: string; attackerId: string; targetId: string }): void {
        this.gameplayService.handleVPCombat(payload.sessionId, payload.attackerId, payload.targetId);
    }

    @OnEvent(ServerEvents.CombatTimerRestart)
    handleCombatTimerRestart(payload: { sessionId: string }): void {
        this.gameplayService.handleVPCombat(payload.sessionId);
    }

    @OnEvent(ServerEvents.VirtualPlayerCombatVictory)
    handleCombatVictory(payload: { sessionId: string; winnerId: string | null; attackerId: string }): void {
        const { sessionId, winnerId, attackerId } = payload;

        const isAttackerVirtual = this.sessionRepository.isVirtualPlayer(sessionId, attackerId);
        if (!isAttackerVirtual) return;

        const session = this.sessionRepository.findById(sessionId);
        if (!session) return;

        const isAttackerStillCurrentTurn = session.currentTurn.activePlayerId === attackerId;
        if (!isAttackerStillCurrentTurn) {
            return;
        }

        if (!winnerId || winnerId === attackerId) {
            setTimeout(() => this.vpExecutionService.continueOrEndTurn(sessionId, attackerId), VIRTUAL_PLAYER_ACTION_DELAY_MS);
        }
    }

    @OnEvent(ServerEvents.VirtualPlayerTurn)
    async handleVirtualPlayerTurn(payload: { sessionId: string; playerId: string; playerType: VirtualPlayerType }): Promise<void> {
        await this.simulateThinkingTime();
        this.vpExecutionService.executeVPTurn(payload.sessionId, payload.playerId, payload.playerType);
    }

    private async simulateThinkingTime(): Promise<void> {
        const randomDelay =
            Math.floor(Math.random() * (VIRTUAL_PLAYER_THINKING_DELAY_MAX_MS - VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS + 1)) +
            VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS;

        return new Promise((resolve) => setTimeout(resolve, randomDelay));
    }
}
