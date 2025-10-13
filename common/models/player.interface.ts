import { Avatar } from '../enums/avatar.enum';

export interface Player {
    id: string;
    name: string;
    avatar: Avatar | null;
    isAdmin: boolean;
}

export interface InGamePlayer extends Player {
    currentPosition: { x: number; y: number };
    isActive: boolean; 
    startPointId: string;
    joinedInGameSession: boolean;
}