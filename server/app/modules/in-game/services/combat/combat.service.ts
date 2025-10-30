import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InGameSession } from '@common/models/session.interface';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { CombatState } from '@common/interfaces/combat.interface';
import { Dice } from '@common/enums/dice.enum';

const DICE_D4_SIDES = 4;
const DICE_D6_SIDES = 6;

@Injectable()
export class CombatService {
    private readonly activeCombats = new Map<string, CombatState>();

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly timerService: TimerService,
        private readonly sessionRepository: InGameSessionRepository,
    ) {}

    startCombat(session: InGameSession, playerAId: string, playerBId: string, x: number, y: number): void {
        const combatState: CombatState = {
            sessionId: session.id,
            playerAId,
            playerBId,
            playerAChoice: null,
            playerBChoice: null,
        };

        this.activeCombats.set(session.id, combatState);
        
        this.eventEmitter.emit('combat.started', {
            session,
            attackerId: playerAId,
            targetId: playerBId,
            x,
            y
        });
    }

    makeChoice(sessionId: string, playerId: string, choice: 'offensive' | 'defensive'): void {
        const combat = this.activeCombats.get(sessionId);
        if (!combat) return;

        if (combat.playerAId === playerId) {
            combat.playerAChoice = choice;
        } else if (combat.playerBId === playerId) {
            combat.playerBChoice = choice;
        }

        // Si les 2 ont choisi, exécuter immédiatement
        if (combat.playerAChoice !== null && combat.playerBChoice !== null) {
            this.processCombatRound(sessionId);
        }
    }

    @OnEvent('combat.timerLoop')
    handleTimerLoop(payload: { sessionId: string }): void {
        const combat = this.activeCombats.get(payload.sessionId);
        if (combat) {
            this.processCombatRound(payload.sessionId);
        }
    }

    @OnEvent('combat.choice')
    handleCombatChoice(payload: { sessionId: string; playerId: string; choice: 'offensive' | 'defensive' }): void {
        this.makeChoice(payload.sessionId, payload.playerId, payload.choice);
    }

    private processCombatRound(sessionId: string): void {
        const combat = this.activeCombats.get(sessionId);
        if (!combat) return;

        const session = this.sessionRepository.findById(sessionId);
        if (!session) return;

        const playerA = session.inGamePlayers[combat.playerAId];
        const playerB = session.inGamePlayers[combat.playerBId];
        if (!playerA || !playerB) return;

        // Calculer les dégâts dans les deux sens
        const damageToB = this.calculateDamage(
            { attack: playerA.attack, dice: playerA.attackDice, choice: combat.playerAChoice },
            { defense: playerB.defense, dice: playerB.defenseDice, choice: combat.playerBChoice }
        );

        const damageToA = this.calculateDamage(
            { attack: playerB.attack, dice: playerB.attackDice, choice: combat.playerBChoice },
            { defense: playerA.defense, dice: playerA.defenseDice, choice: combat.playerAChoice }
        );

        // Appliquer les dégâts (utilise health calculée, pas baseHealth)
        playerA.health = Math.max(0, playerA.health - damageToA);
        playerB.health = Math.max(0, playerB.health - damageToB);

        // Vérifier fin de combat
        if (playerA.health <= 0 || playerB.health <= 0) {
            this.endCombat(session);
            return;
        }

        // Reset des choix pour le prochain round
        combat.playerAChoice = null;
        combat.playerBChoice = null;
    }

    endCombat(session: InGameSession): void {
        this.activeCombats.delete(session.id);
        this.eventEmitter.emit('combat.ended', { session });
    }

    @OnEvent('combat.started')
    handleCombatStarted(payload: { session: InGameSession; attackerId: string; targetId: string }): void {
        this.timerService.startCombatTimer(payload.session.id);
    }

    @OnEvent('combat.ended')
    handleCombatEnded(payload: { session: InGameSession }): void {
        this.timerService.stopCombatTimer(payload.session.id);
    }

    private rollDice(dice: Dice): number {
        switch (dice) {
            case Dice.D4:
                return Math.floor(Math.random() * DICE_D4_SIDES) + 1;
            case Dice.D6:
                return Math.floor(Math.random() * DICE_D6_SIDES) + 1;
            default:
                return 1;
        }
    }

    private calculateDamage(
        attackStats: { attack: number; dice: Dice; choice: 'offensive' | 'defensive' | null },
        defenseStats: { defense: number; dice: Dice; choice: 'offensive' | 'defensive' | null }
    ): number {
        const attackRoll = this.rollDice(attackStats.dice);
        const defenseRoll = this.rollDice(defenseStats.dice);
        
        const attackBonus = attackStats.choice === 'offensive' ? 2 : 0;
        const defenseBonus = defenseStats.choice === 'defensive' ? 2 : 0;
        
        const totalAttack = attackStats.attack + attackRoll + attackBonus;
        const totalDefense = defenseStats.defense + defenseRoll + defenseBonus;
        
        const damage = totalAttack - totalDefense;
        return damage > 0 ? damage : 0;
    }
}
