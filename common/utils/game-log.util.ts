import { ID_GENERATION } from '@common/constants/game-log.constants';

/**
 * Génère un identifiant unique pour une entrée du journal de jeu.
 * Format: timestamp-randomString
 *
 * @returns Un identifiant unique sous forme de chaîne de caractères
 */
export function generateGameLogId(): string {
    return `${Date.now()}-${Math.random().toString(ID_GENERATION.radix).substring(2, 2 + ID_GENERATION.substringLength)}`;
}

