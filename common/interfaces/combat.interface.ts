import { Dice } from '@common/enums/dice.enum';

export interface CombatState {
    sessionId: string;
    playerAId: string;
    playerBId: string;
    playerAPosture: 'offensive' | 'defensive' | null;
    playerBPosture: 'offensive' | 'defensive' | null;
}

export interface CombatResult {
    playerAId: string;
    playerBId: string;
    playerAAttack: {
        dice: Dice;
        diceRoll: number;
        baseAttack: number;
        attackBonus: number;
        totalAttack: number;
    };
    playerBAttack: {
        dice: Dice;
        diceRoll: number;
        baseAttack: number;
        attackBonus: number;
        totalAttack: number;
    };
    playerADefense: {
        dice: Dice;
        diceRoll: number;
        baseDefense: number;
        defenseBonus: number;
        totalDefense: number;
    };
    playerBDefense: {
        dice: Dice;
        diceRoll: number;
        baseDefense: number;
        defenseBonus: number;
        totalDefense: number;
    };
    playerADamage: number;
    playerBDamage: number;
}
