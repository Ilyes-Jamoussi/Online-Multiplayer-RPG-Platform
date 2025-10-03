import { Avatar } from '../enums/avatar.enum';
import { Dice } from '../enums/dice.enum';
import { ItemType } from '../enums/item-type.enum';

export interface Player {
    id: string;
    name: string;
    avatar: Avatar | null;
    isAdmin: boolean;

    maxHp: number;
    currentHp: number;
    speed: number;
    attack: number;
    defense: number;

    attackDice: Dice;
    defenseDice: Dice;

    remainingMoves: number;
    remainingActions: number;
    remainingLives: number;

    combatsWon: number;

    isActive: boolean;
    hasAbandoned: boolean;
    inventory: ItemType[];
}
