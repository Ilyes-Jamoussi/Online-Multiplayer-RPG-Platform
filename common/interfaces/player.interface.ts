import { Dice } from '@common/enums/dice.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Avatar } from '../enums/avatar.enum';

export interface Player {
    id: string;
    name: string;
    avatar: Avatar | null;
    isAdmin: boolean;
    baseHealth: number;
    healthBonus: number;
    health: number;
    maxHealth: number;
    baseSpeed: number;
    speedBonus: number;
    speed: number;
    baseAttack: number;
    attackBonus: number;
    baseDefense: number;
    defenseBonus: number;
    attackDice: Dice;
    defenseDice: Dice;
    x: number;
    y: number;
    isInGame: boolean;
    startPointId: string;
    actionsRemaining: number;
    combatCount: number;
    combatWins: number;
    combatLosses: number;
    combatDraws: number;
    hasCombatBonus: boolean;
    onBoatId?: string;
    virtualPlayerType?: VirtualPlayerType;
}
