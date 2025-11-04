import { COMBAT_WINS_TO_WIN_GAME } from '@app/constants/game-config.constants';
import { DiceSides } from '@app/enums/dice-sides.enum';
import { CombatTimerService } from '@app/modules/in-game/services/combat-timer/combat-timer.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameMovementService } from '@app/modules/in-game/services/in-game-movement/in-game-movement.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { Dice } from '@common/enums/dice.enum';
import { TileCombatEffect } from '@common/enums/tile.enum';
import { CombatState } from '@common/interfaces/combat.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CombatService {
    private readonly activeCombats = new Map<string, CombatState>();

    // eslint-disable-next-line max-params -- NestJS dependency injection requires multiple parameters
    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly timerService: TimerService,
        private readonly combatTimerService: CombatTimerService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly inGameMovementService: InGameMovementService,
        private readonly gameCacheService: GameCacheService,
    ) {}

    combatAbandon(sessionId: string, playerId: string): void {
        const combat = this.activeCombats.get(sessionId);
        if (!combat) throw new NotFoundException('Combat not found');
        if (combat.playerAId !== playerId && combat.playerBId !== playerId) throw new BadRequestException('Player not in combat');
        const winnerId = combat.playerAId === playerId ? combat.playerBId : combat.playerAId;
        const session = this.sessionRepository.findById(sessionId);
        if (!session) throw new NotFoundException('Session not found');
        this.endCombat(session, combat.playerAId, combat.playerBId, winnerId, true);
    }

    getSession(sessionId: string): InGameSession {
        return this.sessionRepository.findById(sessionId);
    }

    attackPlayerAction(sessionId: string, playerId: string, x: number, y: number): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');

        const targetPlayer = Object.values(session.inGamePlayers).find((p) => p.x === x && p.y === y && p.id !== playerId);

        if (!targetPlayer) {
            throw new BadRequestException('No opponent at this position');
        }

        player.actionsRemaining--;
        session.currentTurn.hasUsedAction = true;

        this.startCombat(session, playerId, targetPlayer.id);
    }

    combatChoice(sessionId: string, playerId: string, choice: 'offensive' | 'defensive'): void {
        const combat = this.activeCombats.get(sessionId);
        if (!combat) return;

        if (combat.playerAId === playerId) {
            combat.playerAPosture = choice;
        } else if (combat.playerBId === playerId) {
            combat.playerBPosture = choice;
        } else {
            throw new BadRequestException('Player not in combat');
        }

        this.eventEmitter.emit('combat.postureSelected', { sessionId, playerId, posture: choice });

        if (combat.playerAPosture !== null && combat.playerBPosture !== null) {
            const session = this.sessionRepository.findById(sessionId);
            this.combatTimerService.forceNextLoop(session);
        }
    }

    startCombat(session: InGameSession, playerAId: string, playerBId: string): void {
        const playerATile = this.gameCacheService.getTileByPlayerId(session.id, playerAId);
        const playerBTile = this.gameCacheService.getTileByPlayerId(session.id, playerBId);

        const combatState: CombatState = {
            sessionId: session.id,
            playerAId,
            playerBId,
            playerAPosture: null,
            playerBPosture: null,
            playerATileEffect: TileCombatEffect[playerATile?.kind] ?? 0,
            playerBTileEffect: TileCombatEffect[playerBTile?.kind] ?? 0,
        };

        this.activeCombats.set(session.id, combatState);

        this.timerService.pauseTurnTimer(session.id);
        this.combatTimerService.startCombatTimer(session, playerAId, playerBId, combatState.playerATileEffect, combatState.playerBTileEffect);

        this.sessionRepository.incrementPlayerCombatCount(session.id, playerAId);
        this.sessionRepository.incrementPlayerCombatCount(session.id, playerBId);
    }

    @OnEvent('combat.timerLoop')
    handleTimerLoop(payload: { sessionId: string }): void {
        const combat = this.activeCombats.get(payload.sessionId);
        if (combat) {
            this.combatRound(payload.sessionId);
        }
    }

    private endCombat(session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean = false): void {
        this.activeCombats.delete(session.id);
        this.combatTimerService.stopCombatTimer(session);

        this.eventEmitter.emit('combat.victory', {
            sessionId: session.id,
            playerAId,
            playerBId,
            winnerId,
            abandon,
        });

        if (!winnerId || (winnerId && winnerId !== session.currentTurn.activePlayerId)) {
            this.timerService.endTurnManual(session);
        } else {
            this.timerService.resumeTurnTimer(session.id);
            this.inGameMovementService.calculateReachableTiles(session, session.currentTurn.activePlayerId);
        }
    }

    combatRound(sessionId: string): void {
        const combat = this.activeCombats.get(sessionId);
        if (!combat) return;

        const session = this.sessionRepository.findById(sessionId);
        if (!session) return;

        const playerAId = combat.playerAId;
        const playerBId = combat.playerBId;

        const playerAAttack = this.getPlayerAttack(sessionId, playerAId, combat.playerAPosture, combat.playerATileEffect);
        const playerADefense = this.getPlayerDefense(sessionId, playerAId, combat.playerAPosture, combat.playerATileEffect);
        const playerBAttack = this.getPlayerAttack(sessionId, playerBId, combat.playerBPosture, combat.playerBTileEffect);
        const playerBDefense = this.getPlayerDefense(sessionId, playerBId, combat.playerBPosture, combat.playerBTileEffect);

        const playerADamage = this.calculateDamage(playerBAttack.totalAttack, playerADefense.totalDefense);
        const playerBDamage = this.calculateDamage(playerAAttack.totalAttack, playerBDefense.totalDefense);

        const playerAHealth = this.sessionRepository.decreasePlayerHealth(sessionId, playerAId, playerADamage);
        const playerBHealth = this.sessionRepository.decreasePlayerHealth(sessionId, playerBId, playerBDamage);

        this.eventEmitter.emit('player.healthChanged', {
            sessionId,
            playerId: playerAId,
            newHealth: playerAHealth,
        });

        this.eventEmitter.emit('player.healthChanged', {
            sessionId,
            playerId: playerBId,
            newHealth: playerBHealth,
        });

        this.eventEmitter.emit('player.combatResult', {
            sessionId,
            playerAId,
            playerBId,
            playerAAttack,
            playerBAttack,
            playerADefense,
            playerBDefense,
            playerADamage,
            playerBDamage,
        });

        this.resetCombatPosture(sessionId);

        if (playerAHealth <= 0 || playerBHealth <= 0) {
            const playerADead = playerAHealth <= 0;
            const playerBDead = playerBHealth <= 0;
            const isDraw = playerADead && playerBDead;
            let winnerId: string | null = null;
            if (!isDraw) {
                winnerId = playerADead ? playerBId : playerAId;
            }

            if (playerADead) {
                this.inGameMovementService.movePlayerToStartPosition(session, playerAId);
                this.sessionRepository.resetPlayerHealth(sessionId, playerAId);
            }

            if (playerBDead) {
                this.inGameMovementService.movePlayerToStartPosition(session, playerBId);
                this.sessionRepository.resetPlayerHealth(sessionId, playerBId);
            }

            if (isDraw) {
                this.sessionRepository.incrementPlayerCombatDraws(sessionId, playerAId);
                this.sessionRepository.incrementPlayerCombatDraws(sessionId, playerBId);
            } else {
                const loserId = playerADead ? playerAId : playerBId;
                this.sessionRepository.incrementPlayerCombatWins(sessionId, winnerId);
                this.sessionRepository.incrementPlayerCombatLosses(sessionId, loserId);
            }

            if (winnerId) {
                this.checkGameVictory(sessionId, winnerId, playerAId, playerBId);
            } else {
                this.endCombat(session, playerAId, playerBId, winnerId);
            }
        }
    }

    private resetCombatPosture(sessionId: string): void {
        const combat = this.activeCombats.get(sessionId);
        if (!combat) return;

        combat.playerAPosture = null;
        combat.playerBPosture = null;
    }

    private getPlayerDefense(
        sessionId: string,
        playerId: string,
        posture: 'offensive' | 'defensive',
        tileCombatEffect: TileCombatEffect,
    ): {
        dice: Dice;
        diceRoll: number;
        baseDefense: number;
        defenseBonus: number;
        totalDefense: number;
        tileCombatEffect: TileCombatEffect;
    } {
        const session = this.sessionRepository.findById(sessionId);
        if (!session)
            return { dice: Dice.D4, diceRoll: 0, baseDefense: 0, defenseBonus: 0, totalDefense: 0, tileCombatEffect: TileCombatEffect.BASE };

        const player = session.inGamePlayers[playerId];
        if (!player) return { dice: Dice.D4, diceRoll: 0, baseDefense: 0, defenseBonus: 0, totalDefense: 0, tileCombatEffect: TileCombatEffect.BASE };

        const defenseRoll = this.rollDice(player.defenseDice, sessionId, false);
        const baseDefense = player.baseDefense;
        const defenseBonus = posture === 'defensive' ? 2 : 0;
        const totalDefense = baseDefense + defenseRoll + defenseBonus + tileCombatEffect;
        return { dice: player.defenseDice, diceRoll: defenseRoll, baseDefense, defenseBonus, totalDefense, tileCombatEffect };
    }

    private getPlayerAttack(
        sessionId: string,
        playerId: string,
        posture: 'offensive' | 'defensive',
        tileCombatEffect: TileCombatEffect,
    ): {
        dice: Dice;
        diceRoll: number;
        baseAttack: number;
        attackBonus: number;
        totalAttack: number;
        tileCombatEffect: TileCombatEffect;
    } {
        const session = this.sessionRepository.findById(sessionId);
        if (!session) return { dice: Dice.D4, diceRoll: 0, baseAttack: 0, attackBonus: 0, totalAttack: 0, tileCombatEffect: TileCombatEffect.BASE };
        const player = session.inGamePlayers[playerId];
        if (!player) return { dice: Dice.D4, diceRoll: 0, baseAttack: 0, attackBonus: 0, totalAttack: 0, tileCombatEffect: TileCombatEffect.BASE };
        const attackRoll = this.rollDice(player.attackDice, sessionId, true);
        const baseAttack = player.baseAttack;
        const attackBonus = posture === 'offensive' ? 2 : 0;
        const totalAttack = baseAttack + attackRoll + attackBonus + tileCombatEffect;
        return { dice: player.attackDice, diceRoll: attackRoll, baseAttack, attackBonus, totalAttack, tileCombatEffect };
    }

    private calculateDamage(attack: number, defense: number): number {
        const damage = attack - defense;
        return damage > 0 ? damage : 0;
    }

    private rollDice(dice: Dice, sessionId: string, isAttack: boolean = true): number {
        const session = this.sessionRepository.findById(sessionId);
        if (session?.isAdminModeActive) {
            return isAttack ? DiceSides[dice] : 1;
        }
        return Math.floor(Math.random() * DiceSides[dice]) + 1;
    }

    private checkGameVictory(sessionId: string, winnerId: string, playerAId: string, playerBId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const winner = session.inGamePlayers[winnerId];

        if (winner && winner.combatWins >= COMBAT_WINS_TO_WIN_GAME) {
            this.timerService.forceStopTimer(sessionId);
            this.combatTimerService.stopCombatTimer(session);
            this.eventEmitter.emit('game.over', {
                sessionId,
                winnerId,
                winnerName: winner.name,
            });
        } else {
            this.endCombat(session, playerAId, playerBId, winnerId);
        }
    }
}
