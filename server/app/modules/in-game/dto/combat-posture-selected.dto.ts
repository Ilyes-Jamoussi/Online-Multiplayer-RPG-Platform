import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { CombatPosture } from '@common/enums/combat-posture.enum';

export class CombatPostureSelectedDto {
    @ApiProperty()
    @IsString()
    playerId: string;

    @ApiProperty({ enum: CombatPosture, enumName: 'CombatPosture' })
    @IsEnum(CombatPosture)
    posture: CombatPosture;
}
