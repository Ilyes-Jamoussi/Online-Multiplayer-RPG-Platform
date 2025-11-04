import { Player } from './player.interface';

export interface PlayerStat {
    name: Player['name'];
    wins: Player['combatWins'];
    isWinner: boolean;
}