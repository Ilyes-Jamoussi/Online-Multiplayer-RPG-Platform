import { Dice } from '@common/enums/dice.enum';
import { TileCombatEffect } from '@common/enums/tile-kind.enum';

export interface CombatState {
    sessionId: string;
    playerAId: string;
    playerBId: string;
    playerAPosture: 'offensive' | 'defensive' | null;
    playerBPosture: 'offensive' | 'defensive' | null;
    playerATileEffect: TileCombatEffect | null;
    playerBTileEffect: TileCombatEffect | null;
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
        tileCombatEffect: TileCombatEffect;
    };
    playerBAttack: {
        dice: Dice;
        diceRoll: number;
        baseAttack: number;
        attackBonus: number;
        totalAttack: number;
        tileCombatEffect: TileCombatEffect;
    };
    playerADefense: {
        dice: Dice;
        diceRoll: number;
        baseDefense: number;
        defenseBonus: number;
        totalDefense: number;
        tileCombatEffect: TileCombatEffect;
    };
    playerBDefense: {
        dice: Dice;
        diceRoll: number;
        baseDefense: number;
        defenseBonus: number;
        totalDefense: number;
        tileCombatEffect: TileCombatEffect;
    };
    playerADamage: number;
    playerBDamage: number;
}
