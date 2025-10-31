import { Dice } from '@common/enums/dice.enum';

export interface CombatState {
    sessionId: string;
    playerAId: string;
    playerBId: string;
    playerAChoice: 'offensive' | 'defensive' | null;
    playerBChoice: 'offensive' | 'defensive' | null;
}

export interface CombatResult {
    playerAId: string;
    playerBId: string;
    damageToA: number;
    damageToB: number;
    playerARoll: number;
    playerBRoll: number;
    playerADice: Dice;
    playerBDice: Dice;
}
