export type BonusKey = 'life' | 'speed';
export type Dice = 'D4' | 'D6';
export type DiceAttr = 'attack' | 'defense';

export interface Attributes {
    life: number; speed: number; attack: number; defense: number;
}

export interface CharacterForm {
    name: string;
    avatar: number | null;
    bonus: BonusKey | null;
    diceAssignment: { attack: Dice; defense: Dice };
    attributes: Attributes;
}