import { Dice } from '@common/enums/dice.enum';
import { Avatar } from '../enums/avatar.enum';

export interface Player {
    id: string;
    name: string;
    avatar: Avatar | null;
    isAdmin: boolean;
    speed: number;
    health: number;
    attack: Dice;
    defense: Dice;
    x: number;
    y: number;
    isInGame: boolean;
    startPointId: string;
    movementPoints: number;
}

export interface InGamePlayer extends Player {}
