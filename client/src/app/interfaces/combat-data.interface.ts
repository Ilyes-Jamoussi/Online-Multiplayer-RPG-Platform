import { CombatRole } from '@app/types/game.types';

export interface CombatData {
    attackerId: string;
    targetId: string;
    userRole: CombatRole;
}
