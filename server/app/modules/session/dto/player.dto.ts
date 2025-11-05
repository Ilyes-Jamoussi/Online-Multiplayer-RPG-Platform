import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';

export class PlayerDto {
    @ApiProperty()
    @IsString()
    readonly id: string;

    @ApiProperty()
    @IsString()
    readonly name: string;

    @ApiProperty({ enum: Avatar, enumName: 'Avatar', nullable: true })
    @IsEnum(Avatar)
    readonly avatar: Avatar | null;

    @ApiProperty()
    @IsBoolean()
    readonly isAdmin: boolean;

    @ApiProperty({ enum: Dice, enumName: 'Dice' })
    @IsEnum(Dice)
    readonly attackDice: Dice;

    @ApiProperty({ enum: Dice, enumName: 'Dice' })
    @IsEnum(Dice)
    readonly defenseDice: Dice;

    @ApiProperty()
    @IsNumber()
    readonly baseHealth: number;

    @ApiProperty()
    @IsNumber()
    readonly healthBonus: number;

    @ApiProperty()
    @IsNumber()
    readonly health: number;

    @ApiProperty()
    @IsNumber()
    readonly maxHealth: number;

    @ApiProperty()
    @IsNumber()
    readonly baseAttack: number;

    @ApiProperty()
    @IsNumber()
    readonly attackBonus: number;

    @ApiProperty()
    @IsNumber()
    readonly attack: number;

    @ApiProperty()
    @IsNumber()
    readonly baseDefense: number;

    @ApiProperty()
    @IsNumber()
    readonly defenseBonus: number;

    @ApiProperty()
    @IsNumber()
    readonly defense: number;

    @ApiProperty()
    @IsNumber()
    readonly baseSpeed: number;

    @ApiProperty()
    @IsNumber()
    readonly speedBonus: number;

    @ApiProperty()
    @IsNumber()
    readonly speed: number;

    @ApiProperty()
    @IsNumber()
    readonly actionsRemaining: number;
}
