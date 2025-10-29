import { Player } from '@common/models/player.interface';
import { Dice } from '@common/enums/dice.enum';

export const DEFAULT_PLAYER: Player = {
    id: 'default-player-id',
    name: '',
    avatar: null,
    isAdmin: true,
    speed: 0,
    health: 0,
    attack: Dice.D6,
    defense: Dice.D6,
    x: 0,
    y: 0,
    isInGame: false,
    startPointId: '',
    movementPoints: 0,
};
