import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FlagTransferRequestDto {
    @ApiProperty()
    @IsString()
    fromPlayerId: string;

    @ApiProperty()
    @IsString()
    toPlayerId: string;

    @ApiProperty()
    @IsString()
    fromPlayerName: string;
}
