import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleVisibilityDto {
    @ApiProperty()
    @IsBoolean()
    @IsNotEmpty()
    readonly visibility: boolean;
}
