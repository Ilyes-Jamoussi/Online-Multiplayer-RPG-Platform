import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PlayerNameUpdatedDto {
    @ApiProperty()
    @IsString()
    newName: string;
}
