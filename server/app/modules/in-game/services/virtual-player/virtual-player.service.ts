import { ServerEvents } from '@app/enums/server-events.enum';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class VirtualPlayerService {
    constructor(
        private readonly gameplayService: GameplayService,
    ) {}

    @OnEvent(ServerEvents.CombatStarted)
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
        // Délai aléatoire entre 1.5 et 4 secondes pour simuler la réflexion
        const minDelay = 1500;
        const maxDelay = 4000;
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        
        return new Promise(resolve => setTimeout(resolve, randomDelay));
    }

    private executeVPTurn(sessionId: string, playerId: string, playerType: VirtualPlayerType): void {
        if (playerType === VirtualPlayerType.Offensive) {
            this.gameplayService.executeOffensiveTurn(sessionId, playerId);
        } else {
            this.gameplayService.executeDefensiveTurn(sessionId, playerId);
        }
    }
}
