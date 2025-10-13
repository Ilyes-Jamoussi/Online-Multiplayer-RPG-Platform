import { Avatar } from '@common/enums/avatar.enum';
import { BonusType } from '@common/enums/character-creation.enum';
import { Dice } from '@common/enums/dice.enum';

export interface Character {
    name: string;
    avatar: Avatar | null;
    bonus: BonusType | null;
    diceAssignment: { attack: Dice; defense: Dice };
    attributes: { life: number; speed: number };
}
