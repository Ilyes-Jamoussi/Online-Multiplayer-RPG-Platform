import { Injectable, signal } from '@angular/core';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { CombatSocketService } from '@app/services/combat-socket/combat-socket.service';
import { PlayerService } from '@app/services/player/player.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { ToastService } from '@app/services/toast/toast.service';
import { CombatResult } from '@common/interfaces/combat.interface';
import { Dice } from '@common/enums/dice.enum';
import { TileCombatEffect } from '@common/enums/tile-kind.enum';

const DAMAGE_DISPLAY_DURATION = 2000;
const VICTORY_NOTIFICATION_DURATION = 3000;
const TOAST_DURATION = 5000;

interface CombatData {
    attackerId: string;
    targetId: string;
    userRole: 'attacker' | 'target' | 'spectator';
}

interface VictoryData {
    playerAId: string;
    playerBId: string;
    winnerId: string | null;
    abandon: boolean;
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
    tileEffect: number;
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
    private readonly _tileEffects = signal<Record<string, TileCombatEffect>>({});
    private readonly _minHealthDuringCombat = signal<Record<string, number>>({});
    private readonly _isVictoryNotificationVisible = signal<boolean>(false);
    private readonly _isCombatActive = signal<boolean>(false);
    private victoryNotificationTimeout: ReturnType<typeof setTimeout> | null = null;

    readonly combatData = this._combatData.asReadonly();
    readonly damageDisplays = this._damageDisplays.asReadonly();
    readonly selectedPosture = this._selectedPosture.asReadonly();
    readonly playerPostures = this._playerPostures.asReadonly();
    readonly victoryData = this._victoryData.asReadonly();
    readonly tileEffects = this._tileEffects.asReadonly();
    readonly minHealthDuringCombat = this._minHealthDuringCombat.asReadonly();
    readonly isVictoryNotificationVisible = this._isVictoryNotificationVisible.asReadonly();
    readonly isCombatActive = this._isCombatActive.asReadonly();
    constructor(
        private readonly timerCoordinatorService: TimerCoordinatorService,
        private readonly combatSocketService: CombatSocketService,
        private readonly playerService: PlayerService,
        private readonly inGameService: InGameService,
        private readonly toastService: ToastService,
    ) {
        this.initListeners();
    }

    startCombat(attackerId: string, targetId: string, userRole: 'attacker' | 'target', attackerTileEffect?: number, targetTileEffect?: number): void {
        this._combatData.set({ attackerId, targetId, userRole });
        this._selectedPosture.set(null);
        this._playerPostures.set({});

        this._isCombatActive.set(true);
        const attackerPlayer = this.inGameService.getPlayerByPlayerId(attackerId);
        const targetPlayer = this.inGameService.getPlayerByPlayerId(targetId);

        this._minHealthDuringCombat.set({
            [attackerId]: attackerPlayer.health,
            [targetId]: targetPlayer.health,
        });

        if (attackerTileEffect !== undefined && targetTileEffect !== undefined) {
            this._tileEffects.set({
                [attackerId]: attackerTileEffect,
                [targetId]: targetTileEffect,
            });
        } else {
            this._tileEffects.set({});
        }
    }
    combatAbandon(): void {
        if (this.isInCombat()) {
            this.combatSocketService.combatAbandon(this.inGameService.sessionId());
        }
    }

    closeVictoryOverlay(): void {
        if (this.victoryNotificationTimeout) {
            clearTimeout(this.victoryNotificationTimeout);
            this.victoryNotificationTimeout = null;
        }

        this._isVictoryNotificationVisible.set(false);
        this._combatData.set(null);
        this._selectedPosture.set(null);
        this._playerPostures.set({});
        this._victoryData.set(null);
        this._tileEffects.set({});
        this._minHealthDuringCombat.set({});
    }

    chooseOffensive(): void {
        if (this._selectedPosture() !== null) return;
        this._selectedPosture.set('offensive');
        this.combatSocketService.combatChoice(this.inGameService.sessionId(), 'offensive');
    }

    chooseDefensive(): void {
        if (this._selectedPosture() !== null) return;
        this._selectedPosture.set('defensive');
        this.combatSocketService.combatChoice(this.inGameService.sessionId(), 'defensive');
    }

    attackPlayer(x: number, y: number): void {
        this.combatSocketService.attackPlayerAction(this.inGameService.sessionId(), x, y);
    }

    private isInCombat(): boolean {
        return this._isCombatActive() && this._combatData()?.userRole !== 'spectator';
    }

    private initListeners(): void {
        this.combatSocketService.onCombatStarted((data) => {
            this.handleCombatStarted(data.attackerId, data.targetId, data.attackerTileEffect, data.targetTileEffect);
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
            this._isCombatActive.set(false);
            this.timerCoordinatorService.stopCombatTimer();
            this.timerCoordinatorService.resumeTurnTimer();
            this.handleVictory(data.playerAId, data.playerBId, data.winnerId, data.abandon);
        });

        this.combatSocketService.onCombatCountChanged((data) => {
            this.inGameService.updateInGameSession({
                inGamePlayers: {
                    ...this.inGameService.inGameSession().inGamePlayers,
                    [data.playerId]: {
                        ...this.inGameService.inGameSession().inGamePlayers[data.playerId],
                        combatCount: data.combatCount,
                    },
                },
            });

            if (data.playerId === this.playerService.id()) {
                this.playerService.updatePlayer({ combatCount: data.combatCount });
            }
        });

        this.combatSocketService.onCombatWinsChanged((data) => {
            this.inGameService.updateInGameSession({
                inGamePlayers: {
                    ...this.inGameService.inGameSession().inGamePlayers,
                    [data.playerId]: {
                        ...this.inGameService.inGameSession().inGamePlayers[data.playerId],
                        combatWins: data.combatWins,
                    },
                },
            });

            if (data.playerId === this.playerService.id()) {
                this.playerService.updatePlayer({ combatWins: data.combatWins });
            }
        });

        this.combatSocketService.onCombatLossesChanged((data) => {
            this.inGameService.updateInGameSession({
                inGamePlayers: {
                    ...this.inGameService.inGameSession().inGamePlayers,
                    [data.playerId]: {
                        ...this.inGameService.inGameSession().inGamePlayers[data.playerId],
                        combatLosses: data.combatLosses,
                    },
                },
            });

            if (data.playerId === this.playerService.id()) {
                this.playerService.updatePlayer({ combatLosses: data.combatLosses });
            }
        });

        this.combatSocketService.onCombatDrawsChanged((data) => {
            this.inGameService.updateInGameSession({
                inGamePlayers: {
                    ...this.inGameService.inGameSession().inGamePlayers,
                    [data.playerId]: {
                        ...this.inGameService.inGameSession().inGamePlayers[data.playerId],
                        combatDraws: data.combatDraws,
                    },
                },
            });

            if (data.playerId === this.playerService.id()) {
                this.playerService.updatePlayer({ combatDraws: data.combatDraws });
            }
        });
    }

    private handleCombatResult(data: CombatResult): void {
        const tileEffects = this._tileEffects();

        this.showDamage({
            playerId: data.playerAId,
            damage: data.playerADamage,
            attackRoll: data.playerAAttack.diceRoll,
            attackDice: data.playerAAttack.dice,
            totalAttack: data.playerAAttack.totalAttack,
            defenseRoll: data.playerADefense.diceRoll,
            defenseDice: data.playerADefense.dice,
            totalDefense: data.playerADefense.totalDefense,
            tileEffect: tileEffects[data.playerAId] ?? 0,
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
            tileEffect: tileEffects[data.playerBId] ?? 0,
            visible: true,
        });

        this._selectedPosture.set(null);
    }

    private showDamage(damageDisplay: DamageDisplay): void {
        this._damageDisplays.update((displays) => [...displays.filter((display) => display.playerId !== damageDisplay.playerId), damageDisplay]);

        setTimeout(() => {
            this._damageDisplays.update((displays) =>
                displays.map((display) => (display.playerId === damageDisplay.playerId ? { ...display, visible: false } : display)),
            );
        }, DAMAGE_DISPLAY_DURATION);
    }

    private handleCombatStarted(attackerId: string, targetId: string, attackerTileEffect?: number, targetTileEffect?: number): void {
        this.timerCoordinatorService.pauseTurnTimer();
        if (!this.timerCoordinatorService.isCombatActive()) {
            this.timerCoordinatorService.startCombatTimer();
        }

        const myId = this.playerService.id();

        if (attackerId === myId) {
            this.startCombat(attackerId, targetId, 'attacker', attackerTileEffect, targetTileEffect);
        } else if (targetId === myId) {
            this.startCombat(attackerId, targetId, 'target', attackerTileEffect, targetTileEffect);
        } else {
            this._combatData.set({ attackerId, targetId, userRole: 'spectator' });
            this._isCombatActive.set(true);
            const attackerPlayer = this.inGameService.getPlayerByPlayerId(attackerId);
            const targetPlayer = this.inGameService.getPlayerByPlayerId(targetId);

            this._minHealthDuringCombat.set({
                [attackerId]: attackerPlayer.health,
                [targetId]: targetPlayer.health,
            });

            if (attackerTileEffect !== undefined && targetTileEffect !== undefined) {
                this._tileEffects.set({
                    [attackerId]: attackerTileEffect,
                    [targetId]: targetTileEffect,
                });
            }

            this.toastService.info(`⚔️ Combat en cours : ${attackerPlayer.name} vs ${targetPlayer.name}`, TOAST_DURATION);
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

        if (this._combatData() && !this._victoryData()) {
            this._minHealthDuringCombat.update((minHealth) => ({
                ...minHealth,
                [playerId]: Math.min(minHealth[playerId] ?? newHealth, newHealth),
            }));
        }
    }

    private handleCombatTimerRestart(): void {
        if (!this.timerCoordinatorService.isCombatActive() && this._isCombatActive()) {
            this.timerCoordinatorService.pauseTurnTimer();
            this.timerCoordinatorService.startCombatTimer();
        } else {
            this.timerCoordinatorService.resetCombatTimer();
        }
    }

    private handleCombatNewRound(): void {
        this.timerCoordinatorService.resetCombatTimer();
        this._selectedPosture.set(null);
        this._playerPostures.set({});
    }

    private handlePostureSelected(playerId: string, posture: 'offensive' | 'defensive'): void {
        this._playerPostures.update((postures) => ({
            ...postures,
            [playerId]: posture,
        }));
    }

    private handleVictory(playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean): void {
        const combatData = this._combatData();
        if (combatData?.userRole === 'spectator') {
            const winnerName = winnerId ? this.inGameService.getPlayerByPlayerId(winnerId).name : null;
            const playerAName = this.inGameService.getPlayerByPlayerId(playerAId).name;
            const playerBName = this.inGameService.getPlayerByPlayerId(playerBId).name;

            if (winnerId === null) {
                this.toastService.info(`⚔️ Match nul entre ${playerAName} et ${playerBName}`, TOAST_DURATION);
            } else {
                const loserName = winnerId === playerAId ? playerBName : playerAName;
                if (abandon) {
                    this.toastService.success(`🏆 ${winnerName} a gagné par abandon contre ${loserName}`, TOAST_DURATION);
                } else {
                    this.toastService.success(`🏆 ${winnerName} a vaincu ${loserName}`, TOAST_DURATION);
                }
            }
            this._combatData.set(null);
            this._isCombatActive.set(false);
        } else {
            this._victoryData.set({ playerAId, playerBId, winnerId, abandon });
            this._isVictoryNotificationVisible.set(true);

            if (this.victoryNotificationTimeout) {
                clearTimeout(this.victoryNotificationTimeout);
            }

            this.victoryNotificationTimeout = setTimeout(() => {
                this.closeVictoryOverlay();
            }, VICTORY_NOTIFICATION_DURATION);
        }
    }
}
