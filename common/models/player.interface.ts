import { Dice } from '@common/enums/dice.enum';
import { Avatar } from '../enums/avatar.enum';

export interface Player {
    id: string;
    name: string;
    avatar: Avatar | null;
    isAdmin: boolean;
    baseHealth: number;
    healthBonus: number;
    health: number;        // current HP
    maxHealth: number;     // baseHealth + healthBonus (max HP)
    baseSpeed: number;
    speedBonus: number;
    speed: number;         // baseSpeed + speedBonus (rapidité/mouvement)
    baseAttack: number;
    attackBonus: number;
    attack: number;        // baseAttack + attackBonus
    baseDefense: number;
    defenseBonus: number;
    defense: number;       // baseDefense + defenseBonus
    attackDice: Dice;
    defenseDice: Dice;
    x: number;
    y: number;
    isInGame: boolean;
    startPointId: string;
    actionsRemaining: number;      // nombre d'actions restantes
}
