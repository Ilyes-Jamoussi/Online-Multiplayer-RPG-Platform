import { CombatPosture } from '@common/enums/combat-posture.enum';
import { Dice } from '@common/enums/dice.enum';
import { TileCombatEffect } from '@common/enums/tile.enum';

export interface CombatState {
    sessionId: string;
    playerAId: string;
    playerBId: string;
    playerAPosture: CombatPosture | null;
    playerBPosture: CombatPosture | null;
    playerATileEffect: TileCombatEffect | null;
    playerBTileEffect: TileCombatEffect | null;
}

export interface CombatAttack {
    dice: Dice;
    diceRoll: number;
    baseAttack: number;
    attackBonus: number;
    postureBonus: number;
    totalAttack: number;
    tileCombatEffect: TileCombatEffect;
}

export interface CombatDefense {
    dice: Dice;
    diceRoll: number;
    baseDefense: number;
    defenseBonus: number;
    postureBonus: number;
    totalDefense: number;
    tileCombatEffect: TileCombatEffect;
}

export interface CombatResult {
    playerAId: string;
    playerBId: string;
    playerAAttack: CombatAttack;
    playerBAttack: CombatAttack;
    playerADefense: CombatDefense;
    playerBDefense: CombatDefense;
    playerADamage: number;
    playerBDamage: number;
}
