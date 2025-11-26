import { COMBAT_WINS_TO_WIN_GAME } from '@app/constants/game-config.constants';
import { DiceSides } from '@app/enums/dice-sides.enum';
import { ServerEvents } from '@app/enums/server-events.enum';
import { ActiveCombat } from '@app/interfaces/active-combat.interface';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { MovementService } from '@app/modules/in-game/services/movement/movement.service';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { TileCombatEffect } from '@common/enums/tile.enum';
import { CombatState } from '@common/interfaces/combat.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CombatService {
    private readonly activeCombats = new Map<string, CombatState>();

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly timerService: TimerService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly inGameMovementService: MovementService,
        private readonly gameCacheService: GameCacheService,
    ) {}

    combatAbandon(sessionId: string, playerId: string): void {
        const combat = this.activeCombats.get(sessionId);
        if (!combat) throw new NotFoundException('Combat not found');
        if (combat.playerAId !== playerId && combat.playerBId !== playerId) throw new BadRequestException('Player not in combat');
        const winnerId = combat.playerAId === playerId ? combat.playerBId : combat.playerAId;
        const session = this.sessionRepository.findById(sessionId);
        if (!session) throw new NotFoundException('Session not found');
        this.sessionRepository.incrementPlayerCombatWins(sessionId, winnerId);
        this.endCombat(session, combat.playerAId, combat.playerBId, winnerId, true);
    }

    getSession(sessionId: string): InGameSession | null {
        try {
            return this.sessionRepository.findById(sessionId);
        } catch {
            return null;
        }
    }

    attackPlayerAction(sessionId: string, playerId: string, targetPosition: Position): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');

        const targetPlayer = Object.values(session.inGamePlayers).find(
            (p) => p.x === targetPosition.x && p.y === targetPosition.y && p.id !== playerId,
        );

        if (!targetPlayer) {
            throw new BadRequestException('No opponent at this position');
        }

        player.actionsRemaining--;
        session.currentTurn.hasUsedAction = true;

        this.startCombat(session, playerId, targetPlayer.id);
    }

    combatChoice(sessionId: string, playerId: string, choice: CombatPosture): void {
        const combat = this.activeCombats.get(sessionId);
        if (!combat) return;

        if (combat.playerAId === playerId) {
            combat.playerAPosture = choice;
        } else if (combat.playerBId === playerId) {
            combat.playerBPosture = choice;
        } else {
            throw new BadRequestException('Player not in combat');
        }

        this.eventEmitter.emit(ServerEvents.CombatPostureSelected, { sessionId, playerId, posture: choice });

        if (combat.playerAPosture !== null && combat.playerBPosture !== null) {
            const session = this.sessionRepository.findById(sessionId);
            this.timerService.forceNextLoop(session);
        }
    }

    private startCombat(session: InGameSession, playerAId: string, playerBId: string): void {
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

        this.timerService.startCombat(session, playerAId, playerBId, combatState.playerATileEffect, combatState.playerBTileEffect);

        this.sessionRepository.incrementPlayerCombatCount(session.id, playerAId);
        this.sessionRepository.incrementPlayerCombatCount(session.id, playerBId);
    }

    @OnEvent(ServerEvents.CombatTimerLoop)
    handleTimerLoop(payload: { sessionId: string }): void {
        const combat = this.activeCombats.get(payload.sessionId);
        if (combat) {
            this.combatRound(payload.sessionId);
        }
    }

    clearActiveCombatForSession(sessionId: string): void {
        this.activeCombats.delete(sessionId);
    }

    getActiveCombat(sessionId: string): ActiveCombat | null {
        const combat = this.activeCombats.get(sessionId);
        return combat ? { playerAId: combat.playerAId, playerBId: combat.playerBId } : null;
    }

    private endCombat(session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null, abandon: boolean = false): void {
        this.activeCombats.delete(session.id);
        this.timerService.endCombat(session, winnerId);

        this.eventEmitter.emit(ServerEvents.CombatVictory, {
            sessionId: session.id,
            playerAId,
            playerBId,
            winnerId,
            abandon,
        });

        this.inGameMovementService.calculateReachableTiles(session, session.currentTurn.activePlayerId);
    }

    private combatRound(sessionId: string): void {
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

        this.eventEmitter.emit(ServerEvents.PlayerHealthChanged, {
            sessionId,
            playerId: playerAId,
            newHealth: playerAHealth,
        });

        this.eventEmitter.emit(ServerEvents.PlayerHealthChanged, {
            sessionId,
            playerId: playerBId,
            newHealth: playerBHealth,
        });

        this.eventEmitter.emit(ServerEvents.PlayerCombatResult, {
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
                this.handlePlayerDeath(sessionId, session, playerAId);
            }

            if (playerBDead) {
                this.handlePlayerDeath(sessionId, session, playerBId);
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

    private handlePlayerDeath(sessionId: string, session: InGameSession, playerId: string): void {
        const player = session.inGamePlayers[playerId];
        this.inGameMovementService.movePlayerToStartPosition(session, playerId);
        this.sessionRepository.resetPlayerHealth(sessionId, playerId);
        if (player && this.sessionRepository.playerHasFlag(sessionId, playerId)) {
            this.sessionRepository.dropFlag(sessionId, playerId);
        }
    }

    private getPlayerDefense(
        sessionId: string,
        playerId: string,
        posture: CombatPosture,
        tileCombatEffect: TileCombatEffect,
    ): {
        dice: Dice;
        diceRoll: number;
        baseDefense: number;
        defenseBonus: number;
        postureBonus: number;
        totalDefense: number;
        tileCombatEffect: TileCombatEffect;
    } {
        const session = this.sessionRepository.findById(sessionId);
        if (!session)
            return {
                dice: Dice.D4,
                diceRoll: 0,
                baseDefense: 0,
                defenseBonus: 0,
                postureBonus: 0,
                totalDefense: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            };

        const player = session.inGamePlayers[playerId];
        if (!player)
            return {
                dice: Dice.D4,
                diceRoll: 0,
                baseDefense: 0,
                defenseBonus: 0,
                postureBonus: 0,
                totalDefense: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            };

        const defenseRoll = this.rollDice(player.defenseDice, sessionId, false);
        const baseDefense = player.baseDefense;
        const defenseBonus = player.defenseBonus;
        const postureBonus = posture === CombatPosture.DEFENSIVE ? 2 : 0;
        const totalDefense = baseDefense + defenseRoll + defenseBonus + postureBonus + tileCombatEffect;
        return { dice: player.defenseDice, diceRoll: defenseRoll, baseDefense, defenseBonus, postureBonus, totalDefense, tileCombatEffect };
    }

    private getPlayerAttack(
        sessionId: string,
        playerId: string,
        posture: CombatPosture,
        tileCombatEffect: TileCombatEffect,
    ): {
        dice: Dice;
        diceRoll: number;
        baseAttack: number;
        attackBonus: number;
        postureBonus: number;
        totalAttack: number;
        tileCombatEffect: TileCombatEffect;
    } {
        const session = this.sessionRepository.findById(sessionId);
        if (!session)
            return {
                dice: Dice.D4,
                diceRoll: 0,
                baseAttack: 0,
                attackBonus: 0,
                postureBonus: 0,
                totalAttack: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            };
        const player = session.inGamePlayers[playerId];
        if (!player)
            return {
                dice: Dice.D4,
                diceRoll: 0,
                baseAttack: 0,
                attackBonus: 0,
                postureBonus: 0,
                totalAttack: 0,
                tileCombatEffect: TileCombatEffect.BASE,
            };
        const attackRoll = this.rollDice(player.attackDice, sessionId, true);
        const baseAttack = player.baseAttack;
        const attackBonus = player.attackBonus;
        const postureBonus = posture === CombatPosture.OFFENSIVE ? 2 : 0;
        const totalAttack = baseAttack + attackRoll + attackBonus + postureBonus + tileCombatEffect;
        return { dice: player.attackDice, diceRoll: attackRoll, baseAttack, attackBonus, postureBonus, totalAttack, tileCombatEffect };
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

        if (session.mode !== GameMode.CTF && winner && winner.combatWins >= COMBAT_WINS_TO_WIN_GAME) {
            this.timerService.clearTimerForSession(sessionId);
            this.eventEmitter.emit(ServerEvents.GameOver, {
                sessionId,
                winnerId,
                winnerName: winner.name,
            });
        } else {
            this.endCombat(session, playerAId, playerBId, winnerId);
        }
    }
}
