import { ServerEvents } from '@app/enums/server-events.enum';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS, VIRTUAL_PLAYER_THINKING_DELAY_MAX_MS } from '@app/constants/virtual-player.constants';
import { GameMode } from '@common/enums/game-mode.enum';
import { InGameSession } from '@common/interfaces/session.interface';

@Injectable()
export class VirtualPlayerService {
    constructor(private readonly gameplayService: GameplayService) {}

    @OnEvent(ServerEvents.CombatStarted)
    handleCombatStarted(payload: { sessionId: string; attackerId: string; targetId: string }): void {
        this.gameplayService.handleVPCombat(payload.sessionId, payload.attackerId, payload.targetId);
    }

    @OnEvent(ServerEvents.CombatTimerRestart)
    handleCombatTimerRestart(payload: { sessionId: string }): void {
        this.gameplayService.handleVPCombat(payload.sessionId);
    }

    @OnEvent(ServerEvents.FlagTransferRequested)
    handleFlagTransferRequested(payload: { session: InGameSession; fromPlayerId: string; toPlayerId: string }): void {
        this.gameplayService.handleVPFlagTransferRequest(payload.session.id, payload.toPlayerId, payload.fromPlayerId);
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
        const session = this.gameplayService.getSessionData(sessionId);
        const isCtfMode = session.mode === GameMode.CTF;
        const isOffensive = playerType === VirtualPlayerType.Offensive;

        if (isCtfMode) {
            if (isOffensive) {
                this.gameplayService.ctfOffensiveTurn(sessionId, playerId);
            } else {
                this.gameplayService.ctfDefensiveTurn(sessionId, playerId);
            }
        } else {
            if (isOffensive) {
                this.gameplayService.classicOffensiveTurn(sessionId, playerId);
            } else {
                this.gameplayService.classicDefensiveTurn(sessionId, playerId);
            }
        }
    }
}
