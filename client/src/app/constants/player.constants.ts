import { Player } from '@common/models/player.interface';

export const DEFAULT_PLAYER: Player = {
    id: 'default-player-id',
    name: '',
    avatar: null,
    isAdmin: true,
    speed: 0,
    health: 0,
    attack: 0,
    defense: 0,
};
