import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';

export const BASE_STAT_VALUE = 4;
export const BONUS_STAT_VALUE = 2;

export const PERCENTAGE_MULTIPLIER = 100;
export const HP_HIGH_THRESHOLD_PERCENT = 70;
export const HP_MEDIUM_THRESHOLD_PERCENT = 30;

const DEFAULT_PLAYER_ID = 'default-player-id';

export const DEFAULT_PLAYER: Player = {
    id: DEFAULT_PLAYER_ID,
    name: '',
    avatar: null,
    isAdmin: true,
    baseHealth: BASE_STAT_VALUE,
    healthBonus: 0,
    health: BASE_STAT_VALUE,
    maxHealth: BASE_STAT_VALUE,
    baseSpeed: BASE_STAT_VALUE,
    speedBonus: 0,
    speed: BASE_STAT_VALUE,
    boatSpeedBonus: 0,
    boatSpeed: 0,
    baseAttack: BASE_STAT_VALUE,
    attackBonus: 0,
    baseDefense: BASE_STAT_VALUE,
    defenseBonus: 0,
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
    hasCombatBonus: false,
};
