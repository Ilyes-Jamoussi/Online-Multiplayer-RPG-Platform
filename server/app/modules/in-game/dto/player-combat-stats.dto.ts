import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PlayerCombatStatsDto {
    @ApiProperty()
    @IsString()
    playerId: string;

    @ApiProperty()
    @IsNumber()
    combatCount: number;
}
