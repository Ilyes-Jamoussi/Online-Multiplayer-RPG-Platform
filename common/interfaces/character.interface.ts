import { Avatar } from '@common/enums/avatar.enum';
import { BonusType } from '@common/enums/character-creation.enum';
import { DiceAssignment } from './dice-assignement.interface';
import { Attributes } from './attributes.interface';

export interface Character {
    name: string;
    avatar: Avatar | null;
    bonus: BonusType | null;
    diceAssignment: DiceAssignment;
    attributes: Attributes;
}
