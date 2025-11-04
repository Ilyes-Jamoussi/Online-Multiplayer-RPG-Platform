import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PlayerCombatLossesDto {
    @ApiProperty()
    @IsString()
    playerId: string;

    @ApiProperty()
    @IsNumber()
    combatLosses: number;
}
