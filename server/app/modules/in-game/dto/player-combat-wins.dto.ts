import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PlayerCombatWinsDto {
    @ApiProperty()
    @IsString()
    playerId: string;

    @ApiProperty()
    @IsNumber()
    combatWins: number;
}
