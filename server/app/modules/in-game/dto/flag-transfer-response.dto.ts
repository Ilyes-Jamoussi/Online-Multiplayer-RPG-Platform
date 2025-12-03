import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class FlagTransferResponseDto {
    @ApiProperty()
    @IsString()
    fromPlayerId: string;

    @ApiProperty()
    @IsString()
    toPlayerId: string;

    @ApiProperty()
    @IsBoolean()
    accepted: boolean;
}
