import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';

export class ReachableTileDto {
    @ApiProperty()
    @IsNumber()
    x: number;

    @ApiProperty()
    @IsNumber()
    y: number;

    @ApiProperty()
    @IsNumber()
    cost: number;

    @ApiProperty()
    @IsNumber()
    remainingPoints: number;
}

export class ReachableTilesDto {
    @ApiProperty({ type: [ReachableTileDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReachableTileDto)
    reachable: ReachableTileDto[];
}
