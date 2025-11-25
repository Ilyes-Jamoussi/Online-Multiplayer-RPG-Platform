import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class TeleportEntryDto {
    @ApiProperty()
    @IsString()
    sessionId: string;

    @ApiProperty()
    @IsString()
    playerId: string;

    @ApiProperty()
    @IsNumber()
    originX: number;

    @ApiProperty()
    @IsNumber()
    originY: number;

    @ApiProperty()
    @IsNumber()
    destinationX: number;

    @ApiProperty()
    @IsNumber()
    destinationY: number;
}
