import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class PlayerBonusesChangedDto {
    @ApiProperty()
    @IsNumber()
    attackBonus: number;

    @ApiProperty()
    @IsNumber()
    defenseBonus: number;
}
