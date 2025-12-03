import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PlayerDisembarkedBoatDto {
    @ApiProperty()
    @IsString()
    playerId: string;
}
