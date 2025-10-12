import { Avatar } from '../enums/avatar.enum';

export interface Player {
    id: string;
    name: string;
    avatar: Avatar | null;
    isAdmin: boolean;
}
