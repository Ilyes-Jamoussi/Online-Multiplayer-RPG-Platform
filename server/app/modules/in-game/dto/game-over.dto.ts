import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GameOverDto {
    @ApiProperty()
    @IsString()
    winnerId: string;

    @ApiProperty()
    @IsString()
    winnerName: string;
}
