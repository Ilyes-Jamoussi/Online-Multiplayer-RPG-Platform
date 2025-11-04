export interface CombatData {
    attackerId: string;
    targetId: string;
    userRole: 'attacker' | 'target' | 'spectator';
}
