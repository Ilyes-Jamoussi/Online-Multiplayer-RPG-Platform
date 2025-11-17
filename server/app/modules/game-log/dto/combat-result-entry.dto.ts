export interface CombatResultEntryDto {
    sessionId: string;
    attackerId: string;
    targetId: string;
    attackerAttack: {
        diceRoll: number;
        baseAttack: number;
        attackBonus: number;
        totalAttack: number;
    };
    targetDefense: {
        diceRoll: number;
        baseDefense: number;
        defenseBonus: number;
        totalDefense: number;
    };
    damage: number;
}

