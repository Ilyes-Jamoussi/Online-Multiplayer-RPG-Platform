export interface CombatState {
    sessionId: string;
    playerAId: string;
    playerBId: string;
    playerAChoice: 'offensive' | 'defensive' | null;
    playerBChoice: 'offensive' | 'defensive' | null;
}

export interface CombatResult {
    playerADamage: number;
    playerBDamage: number;
    playerANewHp: number;
    playerBNewHp: number;
    isFinished: boolean;
}
