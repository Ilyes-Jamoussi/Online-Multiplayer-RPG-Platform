import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CombatStartedDto {
    @ApiProperty()
    @IsString()
    attackerId: string;

    @ApiProperty()
    @IsString()
    targetId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    attackerTileEffect?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    targetTileEffect?: number;
}
