import { Injectable } from '@angular/core';
import { AttackPlayerActionDto } from '@app/dto/attack-player-action-dto';
import { CombatAbandonDto } from '@app/dto/combat-abandon-dto';
import { CombatChoiceDto } from '@app/dto/combat-choice-dto';
import { CombatPostureSelectedDto } from '@app/dto/combat-posture-selected-dto';
import { CombatStartedDto } from '@app/dto/combat-started-dto';
import { CombatVictoryDto } from '@app/dto/combat-victory-dto';
import { PlayerCombatDrawsDto } from '@app/dto/player-combat-draws-dto';
import { PlayerCombatLossesDto } from '@app/dto/player-combat-losses-dto';
import { PlayerCombatStatsDto } from '@app/dto/player-combat-stats-dto';
import { PlayerCombatWinsDto } from '@app/dto/player-combat-wins-dto';
import { PlayerHealthChangedDto } from '@app/dto/player-health-changed-dto';
import { SocketService } from '@app/services/socket/socket.service';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { CombatResult } from '@common/interfaces/combat.interface';

@Injectable({ providedIn: 'root' })
export class CombatSocketService {
    constructor(private readonly socketService: SocketService) {}

    attackPlayerAction(dto: AttackPlayerActionDto): void {
        this.socketService.emit(InGameEvents.AttackPlayerAction, dto);
    }

    combatChoice(dto: CombatChoiceDto): void {
        this.socketService.emit(InGameEvents.CombatChoice, dto);
    }

    combatAbandon(dto: CombatAbandonDto): void {
        this.socketService.emit(InGameEvents.CombatAbandon, dto);
    }

    onCombatStarted(callback: (data: CombatStartedDto) => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatStarted, callback);
    }

    onCombatEnded(callback: () => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatEnded, callback);
    }

    onPlayerCombatResult(callback: (data: CombatResult) => void): void {
        this.socketService.onSuccessEvent(InGameEvents.PlayerCombatResult, callback);
    }

    onCombatNewRoundStarted(callback: () => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatNewRoundStarted, callback);
    }

    onPlayerHealthChanged(callback: (data: PlayerHealthChangedDto) => void): void {
        this.socketService.onSuccessEvent(InGameEvents.PlayerHealthChanged, callback);
    }

    onCombatTimerRestart(callback: () => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatTimerRestart, callback);
    }

    onCombatPostureSelected(callback: (data: CombatPostureSelectedDto) => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatPostureSelected, callback);
    }

    onCombatVictory(callback: (data: CombatVictoryDto) => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatVictory, callback);
    }

    onCombatCountChanged(callback: (data: PlayerCombatStatsDto) => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatCountChanged, callback);
    }

    onCombatWinsChanged(callback: (data: PlayerCombatWinsDto) => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatWinsChanged, callback);
    }

    onCombatLossesChanged(callback: (data: PlayerCombatLossesDto) => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatLossesChanged, callback);
    }

    onCombatDrawsChanged(callback: (data: PlayerCombatDrawsDto) => void): void {
        this.socketService.onSuccessEvent(InGameEvents.CombatDrawsChanged, callback);
    }
}
