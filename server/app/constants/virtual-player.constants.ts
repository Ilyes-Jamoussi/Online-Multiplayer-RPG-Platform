import { VPDirection } from '@app/interfaces/vp-direction.interface';
import { Orientation } from '@common/enums/orientation.enum';

export const VIRTUAL_PLAYER_THINKING_DELAY_MIN_MS = 1500;
export const VIRTUAL_PLAYER_THINKING_DELAY_MAX_MS = 4000;
export const VIRTUAL_PLAYER_MOVEMENT_DELAY_MS = 500;
export const VIRTUAL_PLAYER_ACTION_DELAY_MS = 1000;

export const BASE_STAT_POINTS = 4;
export const BONUS_HEALTH_POINTS = 2;
export const RANDOM_THRESHOLD_RATIO = 0.5;

export const VIRTUAL_PLAYER_NAMES = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Epsilon', 'Bot Zeta'];

export const ESCAPE_MAX_DISTANCE_TILES = 5;
export const ESCAPE_NEARBY_RADIUS_TILES = 3;
export const RETURN_FLAG_SEARCH_RADIUS_TILES = 3;

export const RETURN_FLAG_PRIORITY_SCORE = 200;
export const BLOCKED_FLAG_CARRIER_ATTACK_PRIORITY_SCORE = 180;

export const VP_DIRECTIONS: VPDirection[] = [
    { orientation: Orientation.N, dx: 0, dy: -1 },
    { orientation: Orientation.E, dx: 1, dy: 0 },
    { orientation: Orientation.S, dx: 0, dy: 1 },
    { orientation: Orientation.W, dx: -1, dy: 0 },
];
