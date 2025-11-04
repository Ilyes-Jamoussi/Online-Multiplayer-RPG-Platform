import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AdminModeToggledDto {
    @ApiProperty()
    @IsBoolean()
    isAdminModeActive: boolean;
}
