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
    readonly attack: Dice;

    @ApiProperty({ enum: Dice, enumName: 'Dice' })
    @IsEnum(Dice)
    readonly defense: Dice;

    @ApiProperty()
    @IsNumber()
    readonly speed: number;

    @ApiProperty()
    @IsNumber()
    readonly health: number;
}
