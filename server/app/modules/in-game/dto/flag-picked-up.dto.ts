import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FlagPickedUpDto {
    @ApiProperty()
    @IsString()
    playerId: string;
}
