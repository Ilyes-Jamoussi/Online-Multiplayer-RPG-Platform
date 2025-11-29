import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FlagTransferredDto {
    @ApiProperty()
    @IsString()
    fromPlayerId: string;

    @ApiProperty()
    @IsString()
    toPlayerId: string;
}
