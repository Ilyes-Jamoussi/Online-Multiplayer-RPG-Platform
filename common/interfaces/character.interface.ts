import { BonusType, DiceType } from '@common/enums/character-creation.enum';

export interface Character {
    name: string;
    avatar: number | null;
    bonus: BonusType | null;
    diceAssignment: { attack: DiceType; defense: DiceType };
    attributes: { life: number; speed: number };
}
