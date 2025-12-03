import { ApiProperty } from '@nestjs/swagger';

export class PlayerStatisticsDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    combatCount: number;

    @ApiProperty()
    combatWins: number;

    @ApiProperty()
    combatLosses: number;

    @ApiProperty()
    healthLost: number;

    @ApiProperty()
    healthDealt: number;

    @ApiProperty()
    tilesVisitedPercentage: number;
}

export class GlobalStatisticsDto {
    @ApiProperty()
    gameDuration: string;

    @ApiProperty()
    totalTurns: number;

    @ApiProperty()
    tilesVisitedPercentage: number;

    @ApiProperty()
    totalTeleportations: number;

    @ApiProperty()
    doorsManipulatedPercentage: number;

    @ApiProperty()
    sanctuariesUsedPercentage: number;

    @ApiProperty()
    flagHoldersCount: number;
}

export class GameStatisticsDto {
    @ApiProperty()
    winnerId: string;

    @ApiProperty()
    winnerName: string;

    @ApiProperty({ type: [PlayerStatisticsDto] })
    playersStatistics: PlayerStatisticsDto[];

    @ApiProperty()
    globalStatistics: GlobalStatisticsDto;
}
