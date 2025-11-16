import { Dice } from '@common/enums/dice.enum';

export interface DamageDisplay {
    playerId: string;
    damage: number;
    attackRoll: number;
    attackDice: Dice;
    attackBonus: number;
    attackPostureBonus: number;
    totalAttack: number;
    defenseRoll: number;
    defenseDice: Dice;
    defenseBonus: number;
    defensePostureBonus: number;
    totalDefense: number;
    tileEffect: number;
    visible: boolean;
}
