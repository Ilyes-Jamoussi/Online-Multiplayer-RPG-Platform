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

    @ApiProperty({ required: false })
    totalTeleportations?: number;

    @ApiProperty({ required: false })
    doorsManipulatedPercentage?: number;

    @ApiProperty({ required: false })
    sanctuariesUsedPercentage?: number;

    @ApiProperty({ required: false })
    flagHoldersCount?: number;
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
