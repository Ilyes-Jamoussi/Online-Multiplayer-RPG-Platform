export interface PlayerStatistics {
    name: string;
    combatCount: number;
    combatWins: number;
    combatLosses: number;
    healthLost: number;
    healthDealt: number;
    tilesVisitedPercentage: number;
}

export interface GlobalStatistics {
    gameDuration: string;
    totalTurns: number;
    tilesVisitedPercentage: number;
    totalTeleportations?: number;
    doorsManipulatedPercentage?: number;
    sanctuariesUsedPercentage?: number;
    flagHoldersCount?: number;
}

export type SortColumn = keyof PlayerStatistics;
export type SortDirection = 'asc' | 'desc';
