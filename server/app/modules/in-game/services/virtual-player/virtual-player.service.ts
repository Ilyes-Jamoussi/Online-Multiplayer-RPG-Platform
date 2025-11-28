import { ServerEvents } from '@app/enums/server-events.enum';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS, VIRTUAL_PLAYER_THINKING_DELAY_MAX_MS } from '@app/constants/virtual-player.constants';

@Injectable()
export class VirtualPlayerService {
    constructor(private readonly gameplayService: GameplayService) {}

    @OnEvent(ServerEvents.VirtualPlayerCombatStarted)
    handleCombatStarted(payload: { sessionId: string; attackerId: string; targetId: string }): void {
        this.gameplayService.handleVPCombat(payload.sessionId, payload.attackerId, payload.targetId);
    }

    @OnEvent(ServerEvents.CombatTimerRestart)
    handleCombatTimerRestart(payload: { sessionId: string }): void {
        this.gameplayService.handleVPCombat(payload.sessionId);
    }

    @OnEvent(ServerEvents.VirtualPlayerTurn)
    async handleVirtualPlayerTurn(payload: { sessionId: string; playerId: string; playerType: VirtualPlayerType }): Promise<void> {
        await this.simulateThinkingTime();
        this.executeVPTurn(payload.sessionId, payload.playerId, payload.playerType);
    }

    private async simulateThinkingTime(): Promise<void> {
        const randomDelay =
            Math.floor(Math.random() * (VIRTUAL_PLAYER_THINKING_DELAY_MAX_MS - VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS + 1)) +
            VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS;

        return new Promise((resolve) => setTimeout(resolve, randomDelay));
    }

    private executeVPTurn(sessionId: string, playerId: string, playerType: VirtualPlayerType): void {
        if (playerType === VirtualPlayerType.Offensive) {
            this.gameplayService.executeOffensiveTurn(sessionId, playerId);
        } else {
            this.gameplayService.executeDefensiveTurn(sessionId, playerId);
        }
    }
}
