import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/models/player.interface';

export const CHARACTER_BASE = 4;
export const CHARACTER_PLUS = 2;
export const CHARACTER_AVATARS_COUNT = 12;

export const MAX_STAT_VALUE = 6;
export const DEFAULT_BASE_SPEED = 3;
export const DEFAULT_SPEED_BONUS = 1;
export const DEFAULT_ACTIONS = 2;

export const PERCENTAGE_MULTIPLIER = 100;
export const HP_HIGH_THRESHOLD = 70;
export const HP_MEDIUM_THRESHOLD = 30;

const DEFAULT_PLAYER_ID = 'default-player-id';

export const DEFAULT_PLAYER: Player = {
    id: DEFAULT_PLAYER_ID,
    name: '',
    avatar: null,
    isAdmin: true,
    baseHealth: 4,
    healthBonus: 0,
    health: 4,
    maxHealth: 4,
    baseSpeed: 4,
    speedBonus: 0,
    speed: 4,
    baseAttack: 4,
    attackBonus: 0,
    attack: 4,
    baseDefense: 4,
    defenseBonus: 0,
    defense: 4,
    attackDice: Dice.D6,
    defenseDice: Dice.D6,
    x: 0,
    y: 0,
    isInGame: false,
    startPointId: '',
    actionsRemaining: 1,
    combatCount: 0,
    combatWins: 0,
    combatLosses: 0,
    combatDraws: 0,
};
