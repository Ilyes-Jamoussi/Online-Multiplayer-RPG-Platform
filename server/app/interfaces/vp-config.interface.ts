export interface VPConfig {
    health: {
        // Heal if health is below this percentage (e.g., 0.4 = 40%)
        healThreshold: number;
        // Emergency priority boost when health is critically low (e.g., 0.2 = 20%)
        criticalHealthThreshold: number;
    };

    // Base priority scores for each action type (higher = more important)
    priorities: {
        attack: number;
        heal: number;
        fightSanctuary: number;
        flag: number;
        // Escape priority - try to get far from enemies (mainly for defensive VP)
        escape: number;
    };

    // How much to reduce priority per tile of distance
    distanceWeights: {
        attackPenaltyPerTile: number;
        healPenaltyPerTile: number;
        fightSanctuaryPenaltyPerTile: number;
        flagPenaltyPerTile: number;
    };

    // Bonus scores added in specific situations
    bonuses: {
        // Bonus when enemy is adjacent (can attack immediately)
        adjacentAttackBonus: number;
        // Bonus to heal priority when health is below healThreshold
        lowHealthHealBonus: number;
        // Bonus to heal priority when health is below criticalHealthThreshold
        criticalHealthHealBonus: number;
        // Bonus when we have no combat bonuses (makes fight sanctuary more appealing)
        noBonusFightSanctuaryBonus: number;
        // Bonus to escape when enemy is close (within escapeEnemyProximityTiles)
        escapeWhenEnemyCloseBonus: number;
    };

    // Maximum distance to consider each target type (beyond this, ignore)
    maxDistances: {
        maxHealDistance: number;
        maxFightSanctuaryDistance: number;
        maxFlagDistance: number;
        // No max for attack - offensive VP always wants to find enemies
    };

    fightSanctuary: {
        // Chance to use double action (+2/+2 at 50%) vs normal (+1/+1 at 100%)
        doubleActionRate: number;
    };

    escape: {
        // How close an enemy must be to trigger escape bonus (in tiles)
        enemyProximityTiles: number;
        // Bonus per tile of distance from nearest enemy (farther = better)
        distanceBonusPerTile: number;
    };
}

