import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CombatAbandonDto {
    @ApiProperty()
    @IsString()
    sessionId: string;
}
