export interface AttackerAttackDto {
    diceRoll: number;
    baseAttack: number;
    attackBonus: number;
    totalAttack: number;
}

export interface TargetDefenseDto {
    diceRoll: number;
    baseDefense: number;
    defenseBonus: number;
    totalDefense: number;
}

export interface CombatResultEntryDto {
    sessionId: string;
    attackerId: string;
    targetId: string;
    attackerAttack: AttackerAttackDto;
    targetDefense: TargetDefenseDto;
    damage: number;
}

