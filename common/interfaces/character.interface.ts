import { AvatarName } from '../enums/avatar-name.enum';

export enum DiceType {
    D4 = 'D4',
    D6 = 'D6',
}

export enum Stat {
    Life = 'life',
    Speed = 'speed',
    Attack = 'attack',
    Defence = 'defence',
}

export interface Attribute {
    value: number;
    dice?: DiceType;
}

export interface CharacterAttributes {
    name: string;
    avatar: AvatarName;
    stats: {
        vie: Attribute;
        rapidite: Attribute;
        attaque: Attribute;
        defense: Attribute;
    };
}
