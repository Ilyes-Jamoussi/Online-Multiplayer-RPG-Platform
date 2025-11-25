import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class FlagTransferResultDto {
    @ApiProperty()
    @IsString()
    toPlayerId: string;

    @ApiProperty()
    @IsBoolean()
    accepted: boolean;
}
