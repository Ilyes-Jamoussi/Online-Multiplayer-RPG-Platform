import { Avatar } from '../enums/avatar.enum';

export interface Player {
    id: string;
    name: string;
    avatar: Avatar | null;
    isAdmin: boolean;
    speed: number;
    health: number;
    attack: number;
    defense: number;
}

export interface InGamePlayer extends Player {
    x: number;
    y: number;
    joined: boolean;
    startPointId: string;
}
