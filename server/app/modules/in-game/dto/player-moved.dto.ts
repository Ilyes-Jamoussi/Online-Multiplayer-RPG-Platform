import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PlayerMovedDto {
    @ApiProperty()
    @IsString()
    playerId: string;

    @ApiProperty()
    @IsNumber()
    x: number;

    @ApiProperty()
    @IsNumber()
    y: number;

    @ApiProperty()
    @IsNumber()
    speed: number;

    @ApiProperty()
    @IsNumber()
    boatSpeed: number;
}
