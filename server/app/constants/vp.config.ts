import { VPConfig } from '@app/interfaces/vp-config.interface';

/**
 * Offensive VP Configuration
 * - Aggressive behavior, prioritizes combat
 * - Will seek out enemies and attack
 * - Uses fight sanctuary to boost stats
 * - Takes risks for combat advantage
 */
export const OFFENSIVE_VP_CONFIG: VPConfig = {
    health: {
        // Only heal if health drops below 40%
        healThreshold: 0.5,
        // Emergency heal if below 20%
        criticalHealthThreshold: 0.2,
    },

    priorities: {
        // High priority - wants to fight
        attack: 80,
        // Medium priority - will heal if needed
        heal: 50,
        // Good priority - boost stats for combat
        fightSanctuary: 60,
        // High priority in CTF
        flag: 70,
        // No escape - offensive VP doesn't run away
        escape: 0,
    },

    distanceWeights: {
        // Small penalty - will travel far to attack
        attackPenaltyPerTile: 3,
        // Medium penalty - won't travel too far for healing
        healPenaltyPerTile: 5,
        // Medium penalty
        fightSanctuaryPenaltyPerTile: 4,
        // Small penalty - flag is important
        flagPenaltyPerTile: 2,
    },

    bonuses: {
        // Big bonus if enemy is adjacent
        adjacentAttackBonus: 50,
        // Moderate bonus when low health
        lowHealthHealBonus: 30,
        // Big bonus when critical
        criticalHealthHealBonus: 60,
        // Wants combat buffs
        noBonusFightSanctuaryBonus: 20,
        // Never tries to escape
        escapeWhenEnemyCloseBonus: 0,
    },

    maxDistances: {
        maxHealDistance: 10,
        maxFightSanctuaryDistance: 8,
        maxFlagDistance: 20,
    },

    fightSanctuary: {
        // 50% chance to try risky double action
        doubleActionRate: 0.5,
    },

    escape: {
        // Not used for offensive VP
        enemyProximityTiles: 0,
        distanceBonusPerTile: 0,
    },
};

/**
 * Defensive VP Configuration
 * - Cautious behavior, prioritizes survival
 * - Avoids combat when possible
 * - Heals proactively
 * - Plays it safe
 */
export const DEFENSIVE_VP_CONFIG: VPConfig = {
    health: {
        // Heal earlier - below 65%
        healThreshold: 0.65,
        // Critical earlier - below 35%
        criticalHealthThreshold: 0.35,
    },

    priorities: {
        // Low priority - only attacks if necessary
        attack: 40,
        // High priority - survival is key
        heal: 80,
        // Low priority - doesn't seek combat buffs
        fightSanctuary: 30,
        // Medium priority in CTF
        flag: 50,
        // High priority - wants to stay far from enemies
        escape: 70,
    },

    distanceWeights: {
        // High penalty - won't travel far to attack
        attackPenaltyPerTile: 8,
        // Small penalty - will travel for healing
        healPenaltyPerTile: 2,
        // High penalty - not interested in combat buffs
        fightSanctuaryPenaltyPerTile: 6,
        // Medium penalty
        flagPenaltyPerTile: 4,
    },

    bonuses: {
        // Small bonus - not eager to attack
        adjacentAttackBonus: 20,
        // Big bonus - wants to heal
        lowHealthHealBonus: 50,
        // Huge bonus when critical
        criticalHealthHealBonus: 80,
        // Small bonus - doesn't prioritize combat buffs
        noBonusFightSanctuaryBonus: 10,
        // Big bonus to escape when enemy is close
        escapeWhenEnemyCloseBonus: 40,
    },

    maxDistances: {
        // Will travel far for healing
        maxHealDistance: 15,
        // Not interested in fight sanctuary
        maxFightSanctuaryDistance: 5,
        // Medium range for flag
        maxFlagDistance: 15,
    },

    fightSanctuary: {
        // 20% chance to try risky double action - plays it safe
        doubleActionRate: 0.2,
    },

    escape: {
        // Escape if enemy is within 5 tiles
        enemyProximityTiles: 5,
        // Bonus per tile of distance from enemies (farther = better)
        distanceBonusPerTile: 3,
    },
};
