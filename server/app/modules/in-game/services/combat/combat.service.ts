import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InGameSession } from '@common/models/session.interface';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { CombatTimerService } from '@app/modules/in-game/services/combat-timer/combat-timer.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { CombatState } from '@common/interfaces/combat.interface';
import { Dice, DiceSides } from '@common/enums/dice.enum';
import { InGameMovementService } from '@app/modules/in-game/services/in-game-movement/in-game-movement.service';

@Injectable()
export class CombatService {
    private readonly activeCombats = new Map<string, CombatState>();

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly timerService: TimerService,
        private readonly combatTimerService: CombatTimerService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly inGameMovementService: InGameMovementService,
    ) {}

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

        if (combat.playerAId !== playerId && combat.playerBId !== playerId) throw new BadRequestException('Player not in combat');
        if (combat.playerAId === playerId) {
            combat.playerAPosture = choice;
        } else if (combat.playerBId === playerId) {
            combat.playerBPosture = choice;
        }

        this.eventEmitter.emit('combat.postureSelected', { sessionId, playerId, posture: choice });

        if (combat.playerAPosture !== null && combat.playerBPosture !== null) {
            const session = this.sessionRepository.findById(sessionId);
            this.combatTimerService.forceNextLoop(session);
        }
    }

    startCombat(session: InGameSession, playerAId: string, playerBId: string): void {
        const combatState: CombatState = {
            sessionId: session.id,
            playerAId,
            playerBId,
            playerAPosture: null,
            playerBPosture: null,
        };

        this.activeCombats.set(session.id, combatState);

        this.timerService.pauseTurnTimer(session.id);
        this.combatTimerService.startCombatTimer(session, playerAId, playerBId);
    }

    @OnEvent('combat.timerLoop')
    handleTimerLoop(payload: { sessionId: string }): void {
        const combat = this.activeCombats.get(payload.sessionId);
        if (combat) {
            this.combatRound(payload.sessionId);
        }
    }

    @OnEvent('combat.transitionEnded')
    handleCombatTransitionEnded(payload: { sessionId: string }): void {
        const session = this.sessionRepository.findById(payload.sessionId);
        if (session) {
            this.timerService.resumeTurnTimer(session.id);
        }
    }

    private startEndCombatTransition(session: InGameSession, playerAId: string, playerBId: string, winnerId: string | null): void {
        this.activeCombats.delete(session.id);
        this.combatTimerService.stopCombatTimer(session);
        
        this.eventEmitter.emit('combat.victory', {
            sessionId: session.id,
            playerAId,
            playerBId,
            winnerId,
        });
        
        this.combatTimerService.startEndTransition(session);
    }

    combatRound(sessionId: string): void {
        const combat = this.activeCombats.get(sessionId);
        if (!combat) return;

        const session = this.sessionRepository.findById(sessionId);
        if (!session) return;

        const playerAId = combat.playerAId;
        const playerBId = combat.playerBId;

        const playerAAttack = this.getPlayerAttack(sessionId, playerAId, combat.playerAPosture);
        const playerADefense = this.getPlayerDefense(sessionId, playerAId, combat.playerAPosture);
        const playerBAttack = this.getPlayerAttack(sessionId, playerBId, combat.playerBPosture);
        const playerBDefense = this.getPlayerDefense(sessionId, playerBId, combat.playerBPosture);

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
            let winnerId: string | null = null;
            
            if (playerAHealth <= 0 && playerBHealth <= 0) {
                // Draw
                winnerId = null;
            } else if (playerAHealth <= 0) {
                winnerId = playerBId;
            } else {
                winnerId = playerAId;
            }

            this.startEndCombatTransition(session, playerAId, playerBId, winnerId);

            if (playerAHealth <= 0) {
                this.inGameMovementService.movePlayerToStartPosition(session, playerAId);
                this.sessionRepository.resetPlayerHealth(sessionId, playerAId);
            }

            if (playerBHealth <= 0) {
                this.inGameMovementService.movePlayerToStartPosition(session, playerBId);
                this.sessionRepository.resetPlayerHealth(sessionId, playerBId);
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
    ): {
        dice: Dice;
        diceRoll: number;
        baseDefense: number;
        defenseBonus: number;
        totalDefense: number;
    } {
        const session = this.sessionRepository.findById(sessionId);
        if (!session) return { dice: Dice.D4, diceRoll: 0, baseDefense: 0, defenseBonus: 0, totalDefense: 0 };

        const player = session.inGamePlayers[playerId];
        if (!player) return { dice: Dice.D4, diceRoll: 0, baseDefense: 0, defenseBonus: 0, totalDefense: 0 };

        const defenseRoll = this.rollDice(player.defenseDice);
        const baseDefense = player.baseDefense;
        const defenseBonus = posture === 'defensive' ? 2 : 0;
        const totalDefense = baseDefense + defenseRoll + defenseBonus;
        return { dice: player.defenseDice, diceRoll: defenseRoll, baseDefense, defenseBonus, totalDefense };
    }

    private getPlayerAttack(
        sessionId: string,
        playerId: string,
        posture: 'offensive' | 'defensive',
    ): {
        dice: Dice;
        diceRoll: number;
        baseAttack: number;
        attackBonus: number;
        totalAttack: number;
    } {
        const session = this.sessionRepository.findById(sessionId);
        if (!session) return { dice: Dice.D4, diceRoll: 0, baseAttack: 0, attackBonus: 0, totalAttack: 0 };

        const player = session.inGamePlayers[playerId];
        if (!player) return { dice: Dice.D4, diceRoll: 0, baseAttack: 0, attackBonus: 0, totalAttack: 0 };

        const attackRoll = this.rollDice(player.attackDice);
        const baseAttack = player.baseAttack;
        const attackBonus = posture === 'offensive' ? 2 : 0;
        const totalAttack = baseAttack + attackRoll + attackBonus;
        return { dice: player.attackDice, diceRoll: attackRoll, baseAttack, attackBonus, totalAttack };
    }

    private calculateDamage(attack: number, defense: number): number {
        const damage = attack - defense;
        return damage > 0 ? damage : 0;
    }

    private rollDice(dice: Dice): number {
        return Math.floor(Math.random() * DiceSides[dice]) + 1;
    }
}
