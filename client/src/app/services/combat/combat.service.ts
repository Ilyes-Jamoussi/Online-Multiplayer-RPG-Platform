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

interface VictoryData {
    playerAId: string;
    playerBId: string;
    winnerId: string | null;
}

interface DamageDisplay {
    playerId: string;
    damage: number;
    attackRoll: number;
    attackDice: Dice;
    totalAttack: number;
    defenseRoll: number;
    defenseDice: Dice;
    totalDefense: number;
    visible: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    private readonly _combatData = signal<CombatData | null>(null);
    private readonly _combatResult = signal<CombatResult | null>(null);
    private readonly _damageDisplays = signal<DamageDisplay[]>([]);
    private readonly _selectedPosture = signal<'offensive' | 'defensive' | null>(null);
    private readonly _playerPostures = signal<Record<string, 'offensive' | 'defensive'>>({});
    private readonly _victoryData = signal<VictoryData | null>(null);

    readonly combatData = this._combatData.asReadonly();
    readonly damageDisplays = this._damageDisplays.asReadonly();
    readonly selectedPosture = this._selectedPosture.asReadonly();
    readonly playerPostures = this._playerPostures.asReadonly();
    readonly victoryData = this._victoryData.asReadonly();

    constructor(
        private readonly timerService: TimerService,
        private readonly combatSocketService: CombatSocketService,
        private readonly playerService: PlayerService,
        private readonly notificationService: NotificationService,
        private readonly inGameService: InGameService,
    ) {
        this.initListeners();
    }

    get timeRemaining(): number {
        return this.timerService.combatTimeRemaining();
    }

    startCombat(attackerId: string, targetId: string, userRole: 'attacker' | 'target'): void {
        this._combatData.set({ attackerId, targetId, userRole });
        this._selectedPosture.set(null);
        this._playerPostures.set({});
    }

    handleCombatTimerRestart(): void {
        if (!this.timerService.isCombatActive()) {
            this.timerService.startCombatTimer();
        } else {
            this.timerService.resetCombatTimer();
        }
    }

    endCombat(): void {
        this._combatData.set(null);
        this._selectedPosture.set(null);
        this._playerPostures.set({});
        this._victoryData.set(null);
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

        this.combatSocketService.onCombatTimerRestart(() => {
            this.handleCombatTimerRestart();
        });

        this.combatSocketService.onCombatPostureSelected((data) => {
            this.handlePostureSelected(data.playerId, data.posture);
        });

        this.combatSocketService.onCombatVictory((data) => {
            this.handleVictory(data.playerAId, data.playerBId, data.winnerId);
        });
    }

    private handleCombatResult(data: CombatResult): void {
        this.showDamage({
            playerId: data.playerAId,
            damage: data.playerADamage,
            attackRoll: data.playerAAttack.diceRoll,
            attackDice: data.playerAAttack.dice,
            totalAttack: data.playerAAttack.totalAttack,
            defenseRoll: data.playerADefense.diceRoll,
            defenseDice: data.playerADefense.dice,
            totalDefense: data.playerADefense.totalDefense,
            visible: true,
        });

        this.showDamage({
            playerId: data.playerBId,
            damage: data.playerBDamage,
            attackRoll: data.playerBAttack.diceRoll,
            attackDice: data.playerBAttack.dice,
            totalAttack: data.playerBAttack.totalAttack,
            defenseRoll: data.playerBDefense.diceRoll,
            defenseDice: data.playerBDefense.dice,
            totalDefense: data.playerBDefense.totalDefense,
            visible: true,
        });

        this._selectedPosture.set(null);
    }

    private showDamage(damageDisplay: DamageDisplay): void {
        this._damageDisplays.update((displays) => [...displays.filter((d) => d.playerId !== damageDisplay.playerId), damageDisplay]);

        setTimeout(() => {
            this._damageDisplays.update((displays) => displays.map((d) => (d.playerId === damageDisplay.playerId ? { ...d, visible: false } : d)));
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
        this.inGameService.updateInGameSession({
            inGamePlayers: {
                ...this.inGameService.inGameSession().inGamePlayers,
                [playerId]: {
                    ...this.inGameService.inGameSession().inGamePlayers[playerId],
                    health: newHealth,
                },
            },
        });
        if (playerId === this.playerService.id()) {
            this.playerService.updatePlayer({ health: newHealth });
        }
    }

    private handleCombatNewRound(): void {
        this.timerService.resetCombatTimer();
        this._selectedPosture.set(null);
        this._playerPostures.set({});
    }

    private handlePostureSelected(playerId: string, posture: 'offensive' | 'defensive'): void {
        this._playerPostures.update((postures) => ({
            ...postures,
            [playerId]: posture,
        }));
    }

    private handleVictory(playerAId: string, playerBId: string, winnerId: string | null): void {
        this._victoryData.set({ playerAId, playerBId, winnerId });
    }
}
