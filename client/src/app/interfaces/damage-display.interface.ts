import { Dice } from '@common/enums/dice.enum';

export interface DamageDisplay {
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
