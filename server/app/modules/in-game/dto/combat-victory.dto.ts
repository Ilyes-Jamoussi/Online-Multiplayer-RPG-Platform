import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CombatVictoryDto {
    @ApiProperty()
    @IsString()
    playerAId: string;

    @ApiProperty()
    @IsString()
    playerBId: string;

    @ApiProperty({ nullable: true })
    @IsString()
    winnerId: string | null;

    @ApiProperty()
    @IsBoolean()
    abandon: boolean;
}
