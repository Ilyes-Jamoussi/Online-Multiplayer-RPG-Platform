import { Injectable, signal } from '@angular/core';
import { TimerService } from '@app/services/timer/timer.service';
import { CombatSocketService } from '@app/services/combat-socket/combat-socket.service';
import { PlayerService } from '@app/services/player/player.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { CombatResult } from '@common/interfaces/combat.interface';
import { Dice } from '@common/enums/dice.enum';

const DAMAGE_DISPLAY_DURATION = 2000;

interface CombatData {
    attackerId: string;
    targetId: string;
    userRole: 'attacker' | 'target' | 'spectator';
}

interface DamageDisplay {
    playerId: string;
    damage: number;
    roll: number;
    dice: Dice;
    visible: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CombatService {
    private readonly _combatData = signal<CombatData | null>(null);
    private readonly _combatResult = signal<CombatResult | null>(null);
    private readonly _damageDisplays = signal<DamageDisplay[]>([]);
    private readonly _selectedPosture = signal<'offensive' | 'defensive' | null>(null);

    readonly combatData = this._combatData.asReadonly();
    readonly damageDisplays = this._damageDisplays.asReadonly();
    readonly selectedPosture = this._selectedPosture.asReadonly();

    constructor(
        private readonly timerService: TimerService,
        private readonly combatSocketService: CombatSocketService,
        private readonly playerService: PlayerService,
        private readonly notificationService: NotificationService,
        private readonly inGameService: InGameService
    ) {
        this.initListeners();
    }

    get timeRemaining(): number {
        return this.timerService.combatTimeRemaining();
    }

    startCombat(attackerId: string, targetId: string, userRole: 'attacker' | 'target'): void {
        this._combatData.set({ attackerId, targetId, userRole });
        this._selectedPosture.set(null);
        this.timerService.startCombatTimer();
    }

    endCombat(): void {
        this._combatData.set(null);
        this._selectedPosture.set(null);
        this.timerService.stopCombatTimer();
    }

    chooseOffensive(sessionId: string): void {
        if (this._selectedPosture() !== null) return;
        this._selectedPosture.set('offensive');
        this.combatSocketService.combatChoice(sessionId, 'offensive');
    }

    chooseDefensive(sessionId: string): void {
        if (this._selectedPosture() !== null) return;
        this._selectedPosture.set('defensive');
        this.combatSocketService.combatChoice(sessionId, 'defensive');
    }

    attackPlayer(x: number, y: number): void {
        this.combatSocketService.attackPlayerAction(this.inGameService.sessionId(), x, y);
    }

    private initListeners(): void {
        this.combatSocketService.onCombatStarted((data) => {
            this.handleCombatStarted(data.attackerId, data.targetId);
        });

        this.combatSocketService.onCombatEnded(() => {
            this.endCombat();
        });

        this.combatSocketService.onPlayerCombatResult((data: CombatResult) => {
            this._combatResult.set(data);
            this.handleCombatResult(data);
        });

        this.combatSocketService.onPlayerHealthChanged((data) => {
            this.handleHealthChanged(data.playerId, data.newHealth);
        });

        this.combatSocketService.onCombatNewRoundStarted(() => {
            this.handleCombatNewRound();
        });
    }

    private handleCombatResult(data: CombatResult): void {
        if (data.playerADamage > 0) {
            this.showDamage(data.playerAId, data.playerADamage, data.playerAAttack.diceRoll, data.playerAAttack.dice);
        }
        if (data.playerBDamage > 0) {
            this.showDamage(data.playerBId, data.playerBDamage, data.playerBAttack.diceRoll, data.playerBAttack.dice);
        }
        
        this._selectedPosture.set(null);
    }

    private showDamage(playerId: string, damage: number, roll: number, dice: Dice): void {
        if (damage <= 0) return;
        
        this._damageDisplays.update(displays => [
            ...displays.filter(d => d.playerId !== playerId),
            { playerId, damage, roll, dice, visible: true }
        ]);

        setTimeout(() => {
            this._damageDisplays.update(displays => 
                displays.map(d => d.playerId === playerId ? { ...d, visible: false } : d)
            );
        }, DAMAGE_DISPLAY_DURATION);
    }

    private handleCombatStarted(attackerId: string, targetId: string): void {
        const myId = this.playerService.id();

        if (attackerId === myId) {
            this.startCombat(attackerId, targetId, 'attacker');
        } else if (targetId === myId) {
            this.startCombat(attackerId, targetId, 'target');
        } else {
            this._combatData.set({ attackerId, targetId, userRole: 'spectator' });
            this.notificationService.displayInformation({
                title: 'Combat en cours',
                message: 'Un combat est en cours',
            });
        }
    }

    private handleHealthChanged(playerId: string, newHealth: number): void {
        if (playerId === this.playerService.id()) {
            this.playerService.updatePlayer({ health: newHealth });
        }
    }

    private handleCombatNewRound(): void {
        this.timerService.resetCombatTimer();
        this._selectedPosture.set(null);
    }
}
