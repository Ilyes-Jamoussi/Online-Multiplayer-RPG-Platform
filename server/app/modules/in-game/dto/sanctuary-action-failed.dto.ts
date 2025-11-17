import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SanctuaryActionFailedDto {
    @ApiProperty()
    @IsString()
    message: string;
}
