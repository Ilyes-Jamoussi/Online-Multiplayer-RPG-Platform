/**
 * MongoDB projection utilities for data transfer objects (DTOs)
 * These utilities help in selecting specific fields when querying MongoDB
 * to optimize data transfer and maintain consistent data structures
 */

/**
 * Available DTO projection types for MongoDB queries
 * - gameDto: Basic game information and map data
 * - displayGameDto: Game information for display in UI
 * - visibilityDto: Game visibility settings
 * - liveSessionDto: Live game session data
 */
type DtoType = 'gameDto' | 'displayGameDto' | 'visibilityDto' | 'liveSessionDto';

/**
 * Projection for fetching complete game data
 * Includes fields needed for game initialization and gameplay
 */
export const GAME_PROJECTION = {
    _id: 1,
    size: 1,
    name: 1,
    description: 1,
    tiles: 1,
    itemContainers: 1,
} as const;

/**
 * Projection for game display in UI
 * Includes fields needed for game listing and preview
 */
export const DISPLAY_GAME_PROJECTION = {
    _id: 1,
    name: 1,
    size: 1,
    description: 1,
    mapImageUrl: 1,
    lastModified: 1,
    visibility: 1,
} as const;

/**
 * Projection for game visibility settings
 * Used when checking game access permissions
 */
export const VISIBILITY_PROJECTION = {
    _id: 1,
    visibility: 1,
} as const;

/**
 * Projection for live game session data
 * Includes essential fields for active gameplay
 */
export const LIVE_SESSION_PROJECTION = {
    size: 1,
    tiles: 1,
    items: 1,
} as const;

/**
 * Mapping of DTO types to their corresponding MongoDB projections
 * Used to maintain consistent field selection across the application
 */
const DTO_PROJECTIONS: Record<DtoType, Record<string, 1>> = {
    gameDto: GAME_PROJECTION,
    displayGameDto: DISPLAY_GAME_PROJECTION,
    visibilityDto: VISIBILITY_PROJECTION,
    liveSessionDto: LIVE_SESSION_PROJECTION,
};

/**
 * Retrieves the MongoDB projection for a specific DTO type
 * @param type The type of DTO projection to retrieve
 * @returns A MongoDB projection object with field selections
 *
 * @example
 * // Get projection for game display
 * const projection = getProjection('displayGameDto');
 * const games = await gameModel.find({}, projection);
 */
export function getProjection(type: DtoType): Record<string, 1> {
    return DTO_PROJECTIONS[type];
}
