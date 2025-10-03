import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/models/player.model';

export const DEFAULT_PLAYER_ID = 'default-player-id';
export const BASE_STAT = 4;
export const BONUS_STAT = 2;
export const BASE_LIVES = 3;
export const DEFAULT_ATTACK_DICE: Dice = Dice.D6;
export const DEFAULT_DEFENSE_DICE: Dice = Dice.D4;
export const DEFAULT_ACTIONS = 1;
export const MAX_VICTORY_POINTS = 3;

export const DEFAULT_PLAYER: Player = {
    id: DEFAULT_PLAYER_ID,
    name: '',
    avatar: null,
    isAdmin: true,

    maxHp: BASE_STAT,
    currentHp: BASE_STAT,
    speed: BASE_STAT,
    attack: BASE_STAT,
    defense: BASE_STAT,

    attackDice: DEFAULT_ATTACK_DICE,
    defenseDice: DEFAULT_DEFENSE_DICE,

    remainingMoves: BASE_STAT,
    remainingActions: DEFAULT_ACTIONS,
    remainingLives: BASE_LIVES,

    combatsWon: 0,
    isActive: false,
    hasAbandoned: false,
    inventory: [],
};
