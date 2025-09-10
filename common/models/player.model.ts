import { AvatarName } from '@common/enums/avatar-name.enum';
import { DiceType } from '@common/enums/dice-type.enum';
import { ItemType } from '@common/enums/item-type.enum';
import { Position } from '@common/interfaces/position.interface';

export interface Player {
    id: string;
    name: string;
    avatar: AvatarName | null;
    isAdmin: boolean;

    maxHp: number;
    currentHp: number;
    speed: number;
    attack: number;
    defense: number;

    attackDice: DiceType;
    defenseDice: DiceType;

    remainingMoves: number;
    remainingActions: number;
    remainingLives: number;

    combatsWon: number;

    isActive: boolean;
    hasAbandoned: boolean;
    inventory: ItemType[];

    startingPoint: Position;
    currentPosition: Position;
}
