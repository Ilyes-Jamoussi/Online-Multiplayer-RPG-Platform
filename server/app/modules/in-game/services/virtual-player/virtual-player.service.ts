import { ServerEvents } from '@app/enums/server-events.enum';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { DEFAULT_TURN_DURATION } from '@common/constants/in-game';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class VirtualPlayerService {

    constructor(
        private readonly gameplayService: GameplayService
    ) {}

    @OnEvent(ServerEvents.VirtualPlayerTurn)
    handleVirtualPlayerTurn(payload: { sessionId: string; playerId: string; playerType: VirtualPlayerType }): void {
        this.executeTurn(payload.sessionId, payload.playerId, payload.playerType);
    }

    @OnEvent(ServerEvents.CombatStarted)
    handleCombatStarted(payload: { sessionId: string; playerAId: string; playerBId: string }): void {
        this.gameplayService.handleCombatForVirtualPlayers(payload.sessionId, payload.playerAId, payload.playerBId);
    }

    isVirtualPlayer(player: Player): boolean {
        return !!player.virtualPlayerType;
    }

    private async executeTurn(sessionId: string, playerId: string, playerType: VirtualPlayerType): Promise<void> {
        await this.randomDelay();

        playerType === VirtualPlayerType.Offensive
            ? this.playOffensiveTurn(sessionId, playerId)
            : this.playDefensiveTurn(sessionId, playerId);

        await this.randomDelay();
        this.gameplayService.endPlayerTurn(sessionId, playerId);
    }

    private playOffensiveTurn(sessionId: string, playerId: string): void {
        this.gameplayService.playOffensiveTurn(sessionId, playerId);
    }

    private playDefensiveTurn(sessionId: string, playerId: string): void {
        this.gameplayService.playDefensiveTurn(sessionId, playerId);
    }

    private async randomDelay(): Promise<void> {
        const minDelay = DEFAULT_TURN_DURATION * 0.1;
        const maxDelay = DEFAULT_TURN_DURATION * 0.5;
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}
