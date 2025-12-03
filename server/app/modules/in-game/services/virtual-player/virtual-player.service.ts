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
import { InGameSession } from '@common/interfaces/session.interface';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class VirtualPlayerService {
    private readonly logger = new Logger(VirtualPlayerService.name);

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

    @OnEvent(ServerEvents.VirtualPlayerFlagTransferRequested)
    handleFlagTransferRequested(payload: { session: InGameSession; fromPlayerId: string; toPlayerId: string }): void {
        setTimeout(
            () => this.gameplayService.handleVPFlagTransfer(payload.session.id, payload.fromPlayerId, payload.toPlayerId),
            VIRTUAL_PLAYER_ACTION_DELAY_MS,
        );
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
            this.logger.debug(`VP ${attackerId} lost combat or turn ended, not continuing`);
            return;
        }

        if (!winnerId || winnerId === attackerId) {
            this.logger.debug(`VP ${attackerId} won or drew combat, continuing turn`);
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
