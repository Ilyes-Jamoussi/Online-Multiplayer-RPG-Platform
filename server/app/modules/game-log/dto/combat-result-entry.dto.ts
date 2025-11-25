import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';

export class AttackerAttackDto {
    @ApiProperty()
    @IsNumber()
    diceRoll: number;

    @ApiProperty()
    @IsNumber()
    baseAttack: number;

    @ApiProperty()
    @IsNumber()
    attackBonus: number;

    @ApiProperty()
    @IsNumber()
    totalAttack: number;
}

export class TargetDefenseDto {
    @ApiProperty()
    @IsNumber()
    diceRoll: number;

    @ApiProperty()
    @IsNumber()
    baseDefense: number;

    @ApiProperty()
    @IsNumber()
    defenseBonus: number;

    @ApiProperty()
    @IsNumber()
    totalDefense: number;
}

export class CombatResultEntryDto {
    @ApiProperty()
    @IsString()
    sessionId: string;

    @ApiProperty()
    @IsString()
    attackerId: string;

    @ApiProperty()
    @IsString()
    targetId: string;

    @ApiProperty({ type: AttackerAttackDto })
    @ValidateNested()
    @Type(() => AttackerAttackDto)
    attackerAttack: AttackerAttackDto;

    @ApiProperty({ type: TargetDefenseDto })
    @ValidateNested()
    @Type(() => TargetDefenseDto)
    targetDefense: TargetDefenseDto;

    @ApiProperty()
    @IsNumber()
    damage: number;
}
